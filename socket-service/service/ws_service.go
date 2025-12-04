package service

import (
	"sync"

	"github.com/gorilla/websocket"
)

type WSService struct {
	mu          sync.RWMutex
	connections map[string][]*websocket.Conn // userID -> list of connections
}

func NewWSService() *WSService {
	return &WSService{
		connections: make(map[string][]*websocket.Conn),
	}
}

func (s *WSService) AddConnection(userID string, conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.connections[userID] = append(s.connections[userID], conn)
}

func (s *WSService) RemoveConnection(userID string, conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	conns := s.connections[userID]
	newConns := make([]*websocket.Conn, 0, len(conns))
	for _, c := range conns {
		if c != conn {
			newConns = append(newConns, c)
		} else {
			c.Close()
		}
	}
	if len(newConns) == 0 {
		delete(s.connections, userID)
	} else {
		s.connections[userID] = newConns
	}
}

func (s *WSService) GetConnections(userID string) ([]*websocket.Conn, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	conns, ok := s.connections[userID]
	return conns, ok
}
