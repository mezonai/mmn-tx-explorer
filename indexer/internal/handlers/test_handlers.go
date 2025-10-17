package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)


func TestHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Chúc mừng đã vượt qua lớp kiểm tra bảo mật của hệ thống!",
	})
}
