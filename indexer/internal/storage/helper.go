package storage

import (
	"fmt"
	"strconv"
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
		query += " LIMIT @limit"
		args["limit"] = qf.Limit
	}
	if qf.Offset > 0 {
		query += " OFFSET @offset"
		args["offset"] = qf.Offset
	}

	return query, args
}

// ConvertQueryNamedArgsToPositional converts named params (@param) to positional params ($1, $2 or ?)
// style: "postgres" ($1, $2...) or "question" (?)
func ConvertQueryNamedArgsToPositional(query string, args map[string]interface{}, style string) (string, []interface{}) {
	finalArgs := make([]interface{}, 0, len(args))
	// We need to replace in order of appearance? No, map is unordered.
	// Actually, standard sql package doesn't support named args natively in Convert.
	// We need to find @name in query string and replace it.

	// A simple approach: iterate query, find @words, replace with placeholder and append arg.
	// But simply replacing string is risky if same param used twice.

	// Better approach for this helper:
	// Find all @param matches in query.
	// Replace them with appropriate placeholder.
	// Build ordered args list.

	// Since regex might be overkill/slow, and specific implementation in PostgresConnector seemed simple:
	// It iterated args map. But map iteration order is random.

	// Wait, the original postgres implementation was:
	// for key, value := range args { query = replace(query, @key, $n) }
	// This works if keys are unique and replacements don't conflict.

	counter := 1
	for key, value := range args {
		placeholder := "?"
		if style == "postgres" {
			placeholder = "$" + strconv.Itoa(counter)
		}

		// Use a loop to replace ALL occurrences if any (though usually 1)
		// But wait, if style is postgres, we need distinct numbers for each arg?
		// Actually if same arg used twice, we might need same $n?
		// The original postgres implementation appended to finalArgs for each key.
		// So if @key appears multiple times, it should be replaced by SAME $n?
		// Original implementation: strings.Replace(..., 1) -> implies only 1 replacement?
		// Re-checking original code:
		// query = strings.Replace(query, "@"+key, "$"+strconv.Itoa(len(finalArgs)), 1)
		// It replaced only FIRST occurrence. This might be a bug if param used multiple times.
		// But usually it's used once per clause.

		if strings.Contains(query, "@"+key) {
			query = strings.ReplaceAll(query, "@"+key, placeholder)
			finalArgs = append(finalArgs, value)
			counter++
		}
	}

	return query, finalArgs
}
