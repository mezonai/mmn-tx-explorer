CREATE MATERIALIZED VIEW IF NOT EXISTS single_token_transfers_mv TO token_balances AS
SELECT chain_id, owner, address, token_type, token_id, sum(amount) as balance
FROM
(
    SELECT
        chain_id,
        address,
        (topic_0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' AND topic_3 = '') as is_erc20,
        (topic_0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' AND topic_3 != '') as is_erc721,
        (topic_0 = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62') as is_erc1155,
        if(is_erc1155, concat('0x', substring(topic_2, 27, 40)), concat('0x', substring(topic_1, 27, 40))) AS sender_address, -- ERC20 & ERC721 both have topic_1 as sender
        if(is_erc1155, concat('0x', substring(topic_3, 27, 40)), concat('0x', substring(topic_2, 27, 40))) AS receiver_address, -- ERC20 & ERC721 both have topic_2 as receiver
        multiIf(is_erc20, 'erc20', is_erc721, 'erc721', 'erc1155') as token_type,
        multiIf(
            is_erc1155,
            reinterpretAsUInt256(reverse(unhex(substring(data, 3, 64)))),
            is_erc721,
            reinterpretAsUInt256(reverse(unhex(substring(topic_3, 3, 64)))),
            toUInt256(0) -- other
        ) AS token_id,
        multiIf(
            is_erc20 AND length(data) = 66,
            reinterpretAsInt256(reverse(unhex(substring(data, 3)))),
            is_erc721, 
            toInt256(1),
            is_erc1155,
            if(length(data) = 130, reinterpretAsInt256(reverse(unhex(substring(data, 67, 64)))), toInt256(1)),
            toInt256(0) -- unknown
        ) AS transfer_amount,
        (sign * transfer_amount) as amount
    FROM logs
    WHERE
        topic_0 IN (
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62'
        )
)
array join
    [chain_id, chain_id] AS chain_id, 
    [sender_address, receiver_address] AS owner, 
    [-amount, amount] as amount, 
    [token_type, token_type] AS token_type,
    [token_id, token_id] AS token_id,
    [address, address] AS address
GROUP BY chain_id, owner, address, token_type, token_id;
