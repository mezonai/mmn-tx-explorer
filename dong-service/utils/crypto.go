package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"

	"github.com/btcsuite/btcutil/base58"
)

const ed25519SeedSize = 32

var (
	encryptionKey []byte
)

func zeroBytes(b []byte) {
	for i := range b {
		b[i] = 0
	}
}

func InitEncryptionKey() error {

	keyStr := os.Getenv("AES_SECRET_KEY")
	if keyStr == "" {
		return errors.New("AES_SECRET_KEY environment variable not set")
	}

	key, err := base64.StdEncoding.DecodeString(keyStr)
	if err != nil {
		return errors.New("invalid encryption key format")
	}

	if len(key) != 32 {
		return errors.New("encryption key must be 32 bytes for AES-256")
	}

	encryptionKey = make([]byte, len(key))
	copy(encryptionKey, key)

	return nil
}

func EncryptPrivateKey(privateKey string) (string, error) {
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(privateKey), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func DecryptPrivateKey(encryptedPrivateKey string) (string, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedPrivateKey)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func GenerateEphemeralKeyPair() (string, string, error) {
	seed := make([]byte, ed25519SeedSize)
	defer zeroBytes(seed)

	_, err := rand.Read(seed)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate random seed: %w", err)
	}

	privateKey := ed25519.NewKeyFromSeed(seed)
	defer zeroBytes(privateKey)

	publicKey, ok := privateKey.Public().(ed25519.PublicKey)
	if !ok {
		return "", "", fmt.Errorf("failed to cast public key from private key")
	}

	privateKeybs58 := base58.Encode(seed)

	publicKeyBs58 := base58.Encode(publicKey)

	return publicKeyBs58, privateKeybs58, nil
}
