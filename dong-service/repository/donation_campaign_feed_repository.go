package repository

import (
	"database/sql"
	"dong-service/models"
	"fmt"
)

type DonationCampaignFeedRepository struct {
	db         *sql.DB
	dongSchema string
}

func NewDonationCampaignFeedRepository(db *sql.DB, dongSchema string) *DonationCampaignFeedRepository {
	return &DonationCampaignFeedRepository{db: db, dongSchema: dongSchema}
}

func (r *DonationCampaignFeedRepository) GetLatestCampaignFeedByAddress(campaignAddress string) (*models.DonationCampaignFeed, error) {
    query := fmt.Sprintf(`
        SELECT id, tx_hash, owner_address, campaign_address, extra_info, created_at
        FROM %s.donation_campaign_feed
        WHERE campaign_address = $1
        ORDER BY created_at DESC
        LIMIT 1`, r.dongSchema)
    var feed models.DonationCampaignFeed
    err := r.db.QueryRow(query, campaignAddress).Scan(
        &feed.ID,
        &feed.TxHash,
        &feed.OwnerAddress,
        &feed.CampaignAddress,
        &feed.ExtraInfo,
        &feed.CreatedAt,
    )
    if err == sql.ErrNoRows {
        return nil, nil
    }
    if err != nil {
        return nil, fmt.Errorf("failed to get latest campaign feed: %w", err)
    }
    return &feed, nil
}

func (r *DonationCampaignFeedRepository) ListCampaignFeedsByAddress(campaignAddress string) ([]*models.DonationCampaignFeed, error) {
	query := fmt.Sprintf(`
		SELECT id, tx_hash, owner_address, campaign_address, extra_info, created_at
		FROM %s.donation_campaign_feed
		WHERE campaign_address = $1
		ORDER BY created_at DESC`, r.dongSchema)
	rows, err := r.db.Query(query, campaignAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to list campaign feeds: %w", err)
	}
	defer rows.Close()

	var feeds []*models.DonationCampaignFeed
	for rows.Next() {
		var feed models.DonationCampaignFeed
		if err := rows.Scan(
			&feed.ID,
			&feed.TxHash,
			&feed.OwnerAddress,
			&feed.CampaignAddress,
			&feed.ExtraInfo,
			&feed.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan campaign feed: %w", err)
		}
		feeds = append(feeds, &feed)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}
	return feeds, nil
}