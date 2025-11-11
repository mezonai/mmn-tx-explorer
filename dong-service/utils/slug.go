package utils

import (
	"fmt"

	"github.com/gosimple/slug"
)

func GenerateSlug(s string) string {
	return slug.Make(s)
}

func GenerateUniqueSlug(baseSlug string, id int64) string {
	if baseSlug == "" {
		return fmt.Sprintf("campaign-%d", id)
	}
	return fmt.Sprintf("%s-%d", baseSlug, id)
}
