package utils

import "encoding/json"

// ParseBankInfoString attempts to parse a bank_info JSON string into a map object.
// Returns the parsed object if successful, or the original string if parsing fails.
func ParseBankInfoString(bankInfoStr *string) interface{} {
	if bankInfoStr == nil || *bankInfoStr == "" {
		return nil
	}

	var bankInfoObj map[string]interface{}
	if err := json.Unmarshal([]byte(*bankInfoStr), &bankInfoObj); err == nil {
		return bankInfoObj
	}

	return *bankInfoStr
}
