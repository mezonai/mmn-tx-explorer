package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"time"

	"dong-service/models"
	"dong-service/services"

	"github.com/google/uuid"
)

func main() {
	wsURL := flag.String("ws", "ws://localhost:8899/ws/publish", "WebSocket publisher URL")
	apiKey := flag.String("key", "MezonDongServiceEventAPIKey2024!", "API key header value")
	flag.Parse()

	client := services.NewWSClient(*wsURL, *apiKey)
	defer client.CloseNow()

	// wait for connection to be established
	for i := 0; i < 40; i++ {
		if client.IsConnected() {
			break
		}
		time.Sleep(100 * time.Millisecond)
	}

	event := models.Event{
		ID:             uuid.New(),
		Type:           "TEST_PUBLISH",
		Payload:        json.RawMessage("{\"hello\":\"world\"}"),
		ReceiveAddress: "3L449z9yaCEpwmRQPXktGLfXotA4GNV8SERuUdTMxeEz",
		Status:         "pending",
		CreateAt:       time.Now(),
	}

	data, _ := json.Marshal(&event)

	if err := client.Send(data); err != nil {
		fmt.Printf("send failed: %v\n", err)
		return
	}
	fmt.Println("sent event, exiting")
}
