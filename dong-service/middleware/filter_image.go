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
	// "github.com/dutchcoders/go-clamd"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
		allowedExts := make(map[string]bool)
		for _, ext := range cfg.FilterImage.AllowedTypes {
			allowedExts[strings.ToLower(ext)] = true
		}

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
			ext := strings.ToLower(filepath.Ext(fh.Filename))
			if !allowedExts[ext] {
				logger.Warn().Str("filename", fh.Filename).Msg("File has an invalid extension")
				c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, fmt.Sprintf("File '%s' has an invalid extension", fh.Filename)))
				c.Abort()
				return
			}
			header := make([]byte, 512)
			if _, err := f.Read(header); err != nil && err != io.EOF {
				logger.Error().Err(err).Str("filename", fh.Filename).Msg("Cannot read file header")
				c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "Cannot read file header: "+err.Error()))
				c.Abort()
				return
			}
			mimeType := http.DetectContentType(header)
			if !strings.HasPrefix(mimeType, "image/") {
				logger.Warn().Str("filename", fh.Filename).Str("mime_type", mimeType).Msg("File is not an image")
				c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, fmt.Sprintf("File '%s' is not an image (MIME Type: %s)", fh.Filename, mimeType)))
				c.Abort()
				return
			}
			if _, err := f.Seek(0, io.SeekStart); err != nil {
				logger.Error().Err(err).Str("filename", fh.Filename).Msg("Cannot reset file reader")
				c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Cannot reset file reader: "+err.Error()))
				c.Abort()
				return
			}
			// if cfg.FilterImage.EnableVirusScan {
			// 	logger.Info().Str("filename", fh.Filename).Msg("Scanning file for viruses")
			// 	if err := scanFile(f, cfg.FilterImage.VirusScanURL); err != nil {
			// 		logger.Warn().Err(err).Str("filename", fh.Filename).Msg("Virus detected in file")
			// 		c.JSON(http.StatusBadRequest, models.ErrorResponse(http.StatusBadRequest, "File contains a virus: "+err.Error()))
			// 		c.Abort()
			// 		return
			// 	}
			// 	if _, err := f.Seek(0, io.SeekStart); err != nil {
			// 		logger.Error().Err(err).Str("filename", fh.Filename).Msg("Cannot reset file reader after virus scan")
			// 		c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Cannot reset file reader: "+err.Error()))
			// 		c.Abort()
			// 		return
			// 	}
			// }

			content, err := io.ReadAll(f)
			if err != nil {
				logger.Error().Err(err).Str("filename", fh.Filename).Msg("Cannot read file content")
				c.JSON(http.StatusInternalServerError, models.ErrorResponse(http.StatusInternalServerError, "Cannot read file: "+err.Error()))
				c.Abort()
				return
			}
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

// func scanFile(r io.Reader, virusScanURL string) error {
// 	c := clamd.NewClamd(virusScanURL)
// 	response, err := c.ScanStream(r, make(chan bool))
// 	if err != nil {
// 		return err
// 	}
// 	for s := range response {
// 		if s.Status == clamd.RES_FOUND {
// 			return fmt.Errorf("virus detected: %s", s.Description)
// 		}
// 	}
// 	return nil
// }