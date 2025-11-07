package handlers

import (
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Time    string `json:"time"`
}

// @Summary Health check
// @Description Check if the service is running
// @Tags health
// @Accept json
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:  "ok",
		Message: "Service is running",
		Time:    time.Now().Format(time.RFC3339),
	})
}
