CREATE MATERIALIZED VIEW IF NOT EXISTS erc1155_batch_token_transfers_mv TO token_balances AS
SELECT chain_id, owner, address, token_type, token_id, sum(amount) as balance
FROM (
    WITH
        metadata as (
            SELECT
                *,
                3 + 2 * 64 as ids_length_idx,
                ids_length_idx + 64 as ids_values_idx,
                reinterpretAsUInt64(reverse(unhex(substring(data, ids_length_idx, 64)))) AS ids_length,
                ids_length_idx + 64 + (ids_length * 64) as amounts_length_idx,
                reinterpretAsUInt64(reverse(unhex(substring(data, amounts_length_idx, 64)))) AS amounts_length,
                amounts_length_idx + 64 as amounts_values_idx
            FROM logs
            WHERE topic_0 = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb' AND topic_2 != '' AND topic_3 != '' AND ids_length = amounts_length
        ),
        decoded AS (
            SELECT
                *,
                arrayMap(
                    x -> substring(data, ids_values_idx + (x - 1) * 64, 64),
                    range(1, ids_length + 1)
                ) AS ids_hex,
                arrayMap(
                    x -> substring(data, amounts_values_idx + (x - 1) * 64, 64),
                    range(1, amounts_length + 1)
                ) AS amounts_hex
            FROM metadata
        )
    SELECT
        chain_id,
        address,
        concat('0x', substring(topic_2, 27, 40)) AS sender_address,
        concat('0x', substring(topic_3, 27, 40)) AS receiver_address,
        'erc1155' as token_type,
        reinterpretAsUInt256(reverse(unhex(substring(hex_id, 1, 64)))) AS token_id,
        reinterpretAsInt256(reverse(unhex(substring(hex_amount, 1, 64)))) AS transfer_amount,
        (sign * transfer_amount) as amount
    FROM decoded
    ARRAY JOIN ids_hex AS hex_id, amounts_hex AS hex_amount
)
array join
    [chain_id, chain_id] AS chain_id, 
    [sender_address, receiver_address] AS owner, 
    [-amount, amount] as amount, 
    [token_type, token_type] AS token_type,
    [token_id, token_id] AS token_id,
    [address, address] AS address
GROUP BY chain_id, owner, address, token_type, token_id;
