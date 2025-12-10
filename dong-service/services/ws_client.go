package services

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
)

// WSClient keeps a single reconnecting websocket connection used for
// publishing events to socket-service (/ws/publish).
type WSClient struct {
	url       string
	apiKey    string
	conn      *websocket.Conn
	mu        sync.RWMutex
	connected bool
	stop      chan struct{}
}

func NewWSClient(wsURL, apiKey string) *WSClient {
	c := &WSClient{
		url:    wsURL,
		apiKey: apiKey,
		stop:   make(chan struct{}),
	}
	go c.connectLoop()
	return c
}

func (c *WSClient) connectLoop() {
	backoff := 1 * time.Second
	for {
		select {
		case <-c.stop:
			return
		default:
		}

		if err := c.connect(); err != nil {
			log.Error().Err(err).Msg("ws client: connect failed, retrying")
			time.Sleep(backoff)
			if backoff < 30*time.Second {
				backoff *= 2
			}
			continue
		}

		backoff = 1 * time.Second

		// keep reading to detect disconnects
		for {
			if c.isStopped() {
				return
			}
			if _, _, err := c.conn.NextReader(); err != nil {
				log.Error().Err(err).Msg("ws client: read error (connection broken)")
				c.closeConn()
				break
			}
		}
	}
}

func (c *WSClient) connect() error {
	header := http.Header{}
	if c.apiKey != "" {
		header.Set("X-API-Key", c.apiKey)
	}
	dialer := websocket.Dialer{
		Proxy:            http.ProxyFromEnvironment,
		HandshakeTimeout: 10 * time.Second,
	}
	conn, resp, err := dialer.Dial(c.url, header)
	if resp != nil {
		_ = resp.Body.Close()
	}
	if err != nil {
		return fmt.Errorf("dial websocket: %w", err)
	}

	c.mu.Lock()
	c.conn = conn
	c.connected = true
	c.mu.Unlock()
	log.Info().Str("url", c.url).Msg("ws client: connected")
	return nil
}

// Send writes the provided bytes as a text message.
func (c *WSClient) Send(data []byte) error {
	c.mu.RLock()
	conn := c.conn
	ok := c.connected
	c.mu.RUnlock()

	if !ok || conn == nil {
		return fmt.Errorf("ws client: not connected")
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	if err := conn.SetWriteDeadline(time.Now().Add(5 * time.Second)); err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, data)
}

func (c *WSClient) IsConnected() bool {
	c.mu.RLock()
	ok := c.connected && c.conn != nil
	c.mu.RUnlock()
	return ok
}

func (c *WSClient) CloseNow() {
	select {
	case <-c.stop:
		return
	default:
		close(c.stop)
	}
	c.closeConn()
}

func (c *WSClient) closeConn() {
	c.mu.Lock()
	if c.conn != nil {
		_ = c.conn.Close()
		c.conn = nil
	}
	c.connected = false
	c.mu.Unlock()
}

func (c *WSClient) isStopped() bool {
	select {
	case <-c.stop:
		return true
	default:
		return false
	}
}
