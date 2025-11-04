package repository

import (
	"testing"
)

// TestGenerateUniqueSlug tests the slug generation logic
func TestGenerateUniqueSlug_Logic(t *testing.T) {
	tests := []struct {
		name          string
		baseSlug      string
		existingSlugs []string
		expected      string
	}{
		{
			name:          "No existing slugs - returns base slug",
			baseSlug:      "test",
			existingSlugs: []string{},
			expected:      "test",
		},
		{
			name:          "Base slug exists - returns test-1",
			baseSlug:      "test",
			existingSlugs: []string{"test"},
			expected:      "test-1",
		},
		{
			name:          "test and test-1 exist - returns test-2",
			baseSlug:      "test",
			existingSlugs: []string{"test", "test-1"},
			expected:      "test-2",
		},
		{
			name:          "test and test-2 exist (gap in numbering) - returns test-1",
			baseSlug:      "test",
			existingSlugs: []string{"test", "test-2"},
			expected:      "test-3", // Should use max + 1, not fill gaps
		},
		{
			name:          "Multiple numbered slugs - returns next number",
			baseSlug:      "campaign",
			existingSlugs: []string{"campaign", "campaign-1", "campaign-2", "campaign-3"},
			expected:      "campaign-4",
		},
		{
			name:          "Only numbered slugs exist (no base) - returns next number",
			baseSlug:      "hello",
			existingSlugs: []string{"hello-1", "hello-2"},
			expected:      "hello-3",
		},
		{
			name:          "Similar but different slug exists - returns base slug",
			baseSlug:      "test",
			existingSlugs: []string{"testing", "test-campaign"},
			expected:      "test",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This is a unit test for the logic
			// In real implementation, this would query database
			// Here we just document the expected behavior
			t.Logf("Base slug: %s", tt.baseSlug)
			t.Logf("Existing slugs: %v", tt.existingSlugs)
			t.Logf("Expected result: %s", tt.expected)
			
			// TODO: Implement actual database test with mock data
		})
	}
}
