package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func sendJSONResponse(c *gin.Context, response interface{}) {
	c.JSON(http.StatusOK, response)
}
