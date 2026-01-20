
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"dong-service/models"
	"dong-service/logger"
)

type EventService struct {
       APIURL   string
       APIKey     string 
}

var Event *EventService

func InitEventService(apiURL, apiKey string) error {
       Event = &EventService{APIURL: apiURL, APIKey: apiKey}
	   logger.Info().Str("api_url", apiURL).Msg("Event Service initialized")
       return nil
}

func (s *EventService) SendEvent(event *models.Event) error {
       data, err := json.Marshal(event)
       if err != nil {
              return err
       }
       client := &http.Client{}
       req, err := http.NewRequest("POST", s.APIURL, bytes.NewBuffer(data))
       if err != nil {
              return err
       }
       req.Header.Set("Content-Type", "application/json")
       if s.APIKey != "" {
              req.Header.Set("X-API-Key", s.APIKey)
       }
       resp, err := client.Do(req)
       if err != nil {
              return err
       }
       defer resp.Body.Close()
       if resp.StatusCode != http.StatusOK {
              return fmt.Errorf("socket-service trả về mã lỗi: %d", resp.StatusCode)
       }
       return nil
}
