package constants

import "strings"

// SupportedBankNames is the whitelist of bank name labels accepted by the API.
// These labels must match the values sent by the frontend (BANK_OPTIONS labels).
var SupportedBankNames = map[string]struct{}{
	"MB Bank":     {},
	"Vietcombank": {},
	"Techcombank": {},
	"ACB":         {},
	"TPBank":      {},
}

// IsSupportedBank returns true if the given bank name is in the supported list.
func IsSupportedBank(name string) bool {
	_, ok := SupportedBankNames[name]
	return ok
}

// SupportedBankNameList returns a comma-separated list of accepted bank names for error messages.
func SupportedBankNameList() string {
	names := make([]string, 0, len(SupportedBankNames))
	for k := range SupportedBankNames {
		names = append(names, k)
	}
	return strings.Join(names, ", ")
}
