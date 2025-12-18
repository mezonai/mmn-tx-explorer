package common

import "time"

type UserContent struct {
	Type              string    `json:"type"`
	TxHash            string    `json:"tx_hash"`
	CreatorAddress    string    `json:"creator_address"`
	RelatedAddress    string    `json:"related_address"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	ImageCIDs         []string  `json:"image_cids"`
	ParentHash        *string   `json:"parent_hash"`
	RootHash          *string   `json:"root_hash"`
	ReferenceTxHashes []string  `json:"reference_tx_hashes"`
	CreatedAt         time.Time `json:"created_at"`
}
