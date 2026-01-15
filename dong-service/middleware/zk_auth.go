package middleware

import (
	"bytes"
	"dong-service/constants"
	"dong-service/logger"
	"dong-service/models"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	mmnClient "github.com/mezonai/mmn-sdk/go-sdk/client"
	"github.com/mezonai/mmn-sdk/go-sdk/zkverify"
)

var zkVerifier *zkverify.ZkVerify

func InitZKVerifier(keyPath string) error {
	verifier, err := zkverify.NewZkVerify(keyPath)
	if err != nil {
		return err
	}
	zkVerifier = verifier
	return nil
}

type ZKRequestBody struct {
	PublicKey string `json:"publickey"`
	ProofB64  string `json:"proof_b64"`
	PublicB64 string `json:"public_b64"`
	UserID    string `json:"user_id"`
}

func ZKAuthentication() gin.HandlerFunc {
	return func(c *gin.Context) {
		if zkVerifier == nil {
			logger.Error().Msg("ZK Verifier not initialized")
			c.AbortWithStatusJSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Server ZK configuration error"))
			return
		}

		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			logger.Error().Err(err).Msg("Failed to read request body")
			c.AbortWithStatusJSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid request body"))
			return
		}

		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		var zkData ZKRequestBody
		if err := json.Unmarshal(bodyBytes, &zkData); err != nil {
			logger.Error().Err(err).Msg("Failed to parse ZK data from body")
			c.AbortWithStatusJSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Invalid ZK data structure"))
			return
		}

		if zkData.ProofB64 == "" || zkData.PublicB64 == "" || zkData.PublicKey == "" || zkData.UserID == "" {
			logger.Error().Msg("Missing required ZK fields in body")
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
			return
		}

		userAddress := mmnClient.GenerateAddress(zkData.UserID)

		isValid := zkVerifier.Verify(userAddress, zkData.PublicKey, zkData.ProofB64, zkData.PublicB64)
		if !isValid {
			logger.Error().Msg("ZK Proof is invalid")
			c.AbortWithStatusJSON(http.StatusUnauthorized, models.ErrorResponse(http.StatusUnauthorized, constants.ErrUnauthorized))
			return
		}

		c.Set("user_id", zkData.UserID)
		c.Set("address", userAddress)

		c.Next()
	}
}
