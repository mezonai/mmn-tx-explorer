package service

import (
	"sync"

	"github.com/gorilla/websocket"
)

type WSService struct {
	mu          sync.RWMutex
	connections map[string][]*websocket.Conn            // user address -> conns
	rooms       map[string]map[*websocket.Conn]struct{} // room name -> set of conns
}

func NewWSService() *WSService {
	return &WSService{
		connections: make(map[string][]*websocket.Conn),
		rooms:       make(map[string]map[*websocket.Conn]struct{}),
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
	// remove from user connections
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

	// also remove from any rooms the connection belonged to
	for room, connsMap := range s.rooms {
		if _, ok := connsMap[conn]; ok {
			delete(connsMap, conn)
			if len(connsMap) == 0 {
				delete(s.rooms, room)
			}
		}
	}
}

func (s *WSService) GetConnections(userAddress string) ([]*websocket.Conn, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	conns, ok := s.connections[userAddress]
	return conns, ok
}

// Room management
func (s *WSService) AddConnectionToRoom(room string, conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.rooms[room]; !ok {
		s.rooms[room] = make(map[*websocket.Conn]struct{})
	}
	s.rooms[room][conn] = struct{}{}
}

func (s *WSService) RemoveConnectionFromRoom(room string, conn *websocket.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if connsMap, ok := s.rooms[room]; ok {
		delete(connsMap, conn)
		if len(connsMap) == 0 {
			delete(s.rooms, room)
		}
	}
}

func (s *WSService) GetRoomConnections(room string) ([]*websocket.Conn, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if connsMap, ok := s.rooms[room]; ok && len(connsMap) > 0 {
		res := make([]*websocket.Conn, 0, len(connsMap))
		for c := range connsMap {
			res = append(res, c)
		}
		return res, true
	}
	return nil, false
}
