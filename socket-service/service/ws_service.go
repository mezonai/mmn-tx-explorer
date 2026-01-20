package service

import (
	"sync"

	"github.com/gorilla/websocket"
)

type WSService struct {
	mu          sync.RWMutex
	connections map[string][]*websocket.Conn // TODO: Consider using sync.Map later to avoid locking the entire WSService
}

func NewWSService() *WSService {
	return &WSService{
		connections: make(map[string][]*websocket.Conn),
	}
}

func (s *WSService) AddConnection(userAddress string, conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.connections[userAddress] = append(s.connections[userAddress], conn)
}

func (s *WSService) RemoveConnection(userAddress string, conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	conns := s.connections[userAddress]
	newConns := make([]*websocket.Conn, 0, len(conns))
	for _, c := range conns {
		if c != conn {
			newConns = append(newConns, c)
		} else {
			c.Close()
		}
	}
	if len(newConns) == 0 {
		delete(s.connections, userAddress)
	} else {
		s.connections[userAddress] = newConns
	}
}

func (s *WSService) GetConnections(userAddress string) ([]*websocket.Conn, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	conns, ok := s.connections[userAddress]
	return conns, ok
}
