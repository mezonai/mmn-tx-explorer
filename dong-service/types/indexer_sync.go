package types

import "time"

type DongBatchMessage struct {
	OfferUpdates             []OfferUpdate              `json:"offer_updates,omitempty"`
	OrderUpdates             []OrderUpdate              `json:"order_updates,omitempty"`
	RedEnvelopeUpdates       []RedEnvelopeUpdate        `json:"red_envelope_updates,omitempty"`
	RedEnvelopeClaimUpdates  []RedEnvelopeClaimUpdate   `json:"red_envelope_claim_updates,omitempty"`
	UserContents             []UserContent              `json:"user_contents,omitempty"`
}

type RedEnvelopeClaimUpdate struct {
	ClaimID int64  `json:"claim_id"`
	Status  string `json:"status"`
	TxHash  string `json:"tx_hash"`
}

type OfferUpdate struct {
	OfferID int64  `json:"offer_id"`
	Status  string `json:"status"`
	TxHash  string `json:"tx_hash"`
}

type OrderUpdate struct {
	OfferID int64  `json:"offer_id"`
	OrderID int64  `json:"order_id"`
	Status  string `json:"status"`
	TxHash  string `json:"tx_hash"`
}

type RedEnvelopeUpdate struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	TxHash string `json:"tx_hash"`
}

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
