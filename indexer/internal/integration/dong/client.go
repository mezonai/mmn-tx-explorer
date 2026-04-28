package dong

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
)

type DongUpdateEntry struct {
	ID              string `json:"id"`
	Status          int    `json:"status"`
	TransactionHash string `json:"transaction_hash"`
}

type DongBatchUpdateRequest struct {
	Updates []DongUpdateEntry `json:"updates"`
}

type Client struct {
	apiURL     string
	apiKey     string
	httpClient *http.Client
}

func NewClient(apiURL, apiKey string) *Client {
	return &Client{
		apiURL:     apiURL,
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) UpdateRedEnvelopeStatus(ctx context.Context, updates []DongUpdateEntry) error {
	
	if len(updates) == 0 {
		log.Info().Msg("No updates to send to dong service")
		return nil
	}

	payload := DongBatchUpdateRequest{Updates: updates}
	body, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Msg("failed to marshal dong service payload")
		return fmt.Errorf("failed to marshal dong service payload: %w", err)
	}

	url := fmt.Sprintf("%s/update-status-red-envelope", c.apiURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		log.Error().Err(err).Msg("failed to create dong service request")
		return fmt.Errorf("failed to create dong service request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("X-Internal-Key", c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Error().Err(err).Str("url", url).Msg("failed to call dong service")
		return fmt.Errorf("failed to call dong service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Error().Int("status_code", resp.StatusCode).Str("url", url).Msg("dong service returned non-OK status")
		return fmt.Errorf("dong service returned non-OK status: %d", resp.StatusCode)
	}

	log.Info().Int("status_code", resp.StatusCode).Msg("Successfully updated red envelope statuses via dong service")
	return nil
}
