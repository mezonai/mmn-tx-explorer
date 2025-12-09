package middleware

import (
	"dong-service/config"
	"dong-service/logger"
	"dong-service/models"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"github.com/dutchcoders/go-clamd"
	"dong-service/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gabriel-vasile/mimetype"
)

type UploadedFile struct {
	NewName string
	Content []byte
}

func FilterImageMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := c.Request.ParseMultipartForm(int64(cfg.FilterImage.MaxSizeUpload) << 20); err != nil {
			logger.Error().Err(err).Msg("Failed to parse multipart form")
			c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Failed to parse form: "+err.Error()))
			c.Abort()
			return
		}
		files := c.Request.MultipartForm.File["files"]
		if len(files) == 0 {
			logger.Warn().Msg("No files uploaded (field 'files')")
			c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "No files uploaded (field 'files')"))
			c.Abort()
			return
		}
		var totalSize int64
		var result []UploadedFile

		for _, fh := range files {
			totalSize += fh.Size
			if totalSize > int64(cfg.FilterImage.MaxSizeUpload)<<20 {
				logger.Warn().Msg("Total uploaded file size exceeds limit 5MB")
				c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Total uploaded file size exceeds limit 5MB."))
				c.Abort()
				return
			}
			f, err := fh.Open()
			if err != nil {
				logger.Error().Err(err).Str("filename", fh.Filename).Msg("Failed to open file")
				c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Failed to open file: "+err.Error()))
				c.Abort()
				return
			}
			defer f.Close()
			content, err := io.ReadAll(f)
			if err != nil {
				logger.Error().Err(err).Str("filename", fh.Filename).Msg("Cannot read file content")
				c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Cannot read file content"))
				c.Abort()
				return
			}

			m := mimetype.Detect(content)
			logger.Info().Str("filename", fh.Filename).Str("mime_detected", m.String()).Str("ext_detected", m.Extension()).Msg("MIME type detected via magic bytes")

			if !strings.HasPrefix(m.String(), "image/") {
				logger.Warn().Str("filename", fh.Filename).Str("mime_detected", m.String()).Msg("File is NOT an image")
				c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, fmt.Sprintf("File '%s' is not an image (MIME: %s)", fh.Filename, m.String())))
				c.Abort()
				return
			}
			blocked := false
			for _, blockedType := range cfg.FilterImage.BlockMimeTypes {
				if m.String() == blockedType {
					blocked = true
					break
				}
			}
			if blocked {
				logger.Warn().Str("filename", fh.Filename).Str("mime_detected", m.String()).Msg("File MIME type is blocked")
				c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, fmt.Sprintf("File '%s' has a blocked MIME type: %s", fh.Filename, m.String())))
				c.Abort()
				return
			}
			if _, err := f.Seek(0, io.SeekStart); err != nil {
				logger.Error().Err(err).Str("filename", fh.Filename).Msg("Cannot reset file reader")
				c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Cannot reset file reader: "+err.Error()))
				c.Abort()
				return
			}
			if cfg.FilterImage.EnableVirusScan {
				logger.Info().Str("filename", fh.Filename).Msg("Scanning file for viruses")
				if err := scanFile(f); err != nil {
					logger.Warn().Err(err).Str("filename", fh.Filename).Msg("Virus detected in file")
					c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "File contains a virus: "+err.Error()))
					c.Abort()
					return
				}
				if _, err := f.Seek(0, io.SeekStart); err != nil {
					logger.Error().Err(err).Str("filename", fh.Filename).Msg("Cannot reset file reader after virus scan")
					c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Cannot reset file reader: "+err.Error()))
					c.Abort()
					return
				}
			}

			ext := strings.ToLower(filepath.Ext(fh.Filename))
			newName := uuid.New().String() + ext
			result = append(result, UploadedFile{
				NewName: newName,
				Content: content,
			})
		}

		c.Set("uploaded_files", result)
		c.Next()
	}
}

func scanFile(r io.Reader) error {
	c := services.ClamAV
	response, err := c.ScanStream(r, make(chan bool))
	if err != nil {
		return err
	}
	for s := range response {
		if s.Status == clamd.RES_FOUND {
			return fmt.Errorf("virus detected: %s", s.Description)
		}
	}
	return nil
}