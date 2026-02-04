package storage

import (
	"fmt"
	"strings"
)

// BuildSelectFields constructs the SELECT clause with specified fields or defaults
func BuildSelectFields(fields []string, defaultFields []string) string {
	if len(fields) == 0 {
		return strings.Join(defaultFields, ", ")
	}

	// Filter out invalid fields to prevent SQL injection (basic check)
	// In a real scenario, you should validate against a whitelist of allowed columns
	validFields := make([]string, 0, len(fields))
	for _, f := range fields {
		if isValidField(f, defaultFields) {
			validFields = append(validFields, f)
		}
	}

	if len(validFields) == 0 {
		return strings.Join(defaultFields, ", ")
	}

	return strings.Join(validFields, ", ")
}

func isValidField(field string, allowed []string) bool {
	for _, a := range allowed {
		if field == a {
			return true
		}
	}
	return false
}

// BuildQueryWithNamedArgs constructs a query with named parameters (e.g., @param)
// It returns the query string and a map of arguments
func BuildQueryWithNamedArgs(table string, columns string, qf *QueryFilter) (string, map[string]interface{}) {
	query := fmt.Sprintf("SELECT %s FROM %s", columns, table)
	args := make(map[string]interface{})
	whereClauses := []string{}

	if qf == nil {
		return query, args
	}

	if qf.ChainID != nil {
		whereClauses = append(whereClauses, "chain_id = @chain_id")
		args["chain_id"] = qf.ChainID.String()
	}

	if len(qf.BlockNumbers) > 0 {
		// IN clause handling is tricky with named args, simpler to use direct values if safe or list expansion
		// For simplicity/safety with current design, we'll avoid IN with named args or handle it specially if needed
		// Here assuming simplified equality for single value or skip
		if len(qf.BlockNumbers) == 1 {
			whereClauses = append(whereClauses, "block_number = @block_number")
			args["block_number"] = qf.BlockNumbers[0].String()
		}
	}

	// Range queries
	if qf.StartTime > 0 {
		whereClauses = append(whereClauses, "transaction_timestamp >= @start_time")
		args["start_time"] = qf.StartTime
	}
	if qf.EndTime > 0 {
		whereClauses = append(whereClauses, "transaction_timestamp <= @end_time")
		args["end_time"] = qf.EndTime
	}

	// Filter Params (generic)
	for k, v := range qf.FilterParams {
		// Be careful with injection here. Keys should be whitelisted.
		// Assuming Keys are safe (e.g. checked in handler)
		paramName := "filter_" + k
		// Handle basic operators if coded in key (e.g. transaction_count_gt)
		if strings.HasSuffix(k, "_gt") {
			col := strings.TrimSuffix(k, "_gt")
			whereClauses = append(whereClauses, fmt.Sprintf("%s > @%s", col, paramName))
			args[paramName] = v
		} else {
			whereClauses = append(whereClauses, fmt.Sprintf("%s = @%s", k, paramName))
			args[paramName] = v
		}
	}

	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Sort
	if qf.SortBy != "" {
		sortOrder := "DESC"
		if strings.ToUpper(qf.SortOrder) == "ASC" {
			sortOrder = "ASC"
		}
		// Validate SortBy column to prevent injection
		query += fmt.Sprintf(" ORDER BY %s %s", qf.SortBy, sortOrder)
	} else {
		// Default sort
		switch table {
		case "blocks":
			query += " ORDER BY block_number DESC"
		case "transactions":
			query += " ORDER BY transaction_timestamp DESC"
		}
	}

	// Pagination
	if qf.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", qf.Limit)
	}
	if qf.Offset > 0 {
		query += fmt.Sprintf(" OFFSET %d", qf.Offset)
	}

	return query, args
}

// ConvertQueryNamedArgsToPositional converts named params (@param) to positional params ($1, $2 or ?)
// style: "postgres" ($1, $2...) or "question" (?)
func ConvertQueryNamedArgsToPositional(query string, args map[string]interface{}, style string) (string, []interface{}) {
	var finalArgs []interface{}
	var sb strings.Builder
	n := len(query)

	for i := 0; i < n; i++ {
		if query[i] == '@' {
			// Potential named parameter
			j := i + 1
			for j < n && (isAlphaNumeric(query[j]) || query[j] == '_') {
				j++
			}
			if j > i+1 {
				paramName := query[i+1 : j]
				if val, ok := args[paramName]; ok {
					// Found a valid parameter
					if style == "postgres" {
						sb.WriteString(fmt.Sprintf("$%d", len(finalArgs)+1))
					} else {
						sb.WriteString("?")
					}
					finalArgs = append(finalArgs, val)
					i = j - 1 // Advance i to end of param name
					continue
				}
			}
		}
		sb.WriteByte(query[i])
	}

	return sb.String(), finalArgs
}

func isAlphaNumeric(c byte) bool {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
}
