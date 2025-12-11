package repository

import (
	"database/sql"
	"dong-service/models"
	"fmt"
	"time"

	"github.com/lib/pq"
)

const FeedTypeDonationCampaign = "donation-campaign-feed"

type DonationCampaignFeedRepository struct {
	db         *sql.DB
	dongSchema string
}

func NewDonationCampaignFeedRepository(db *sql.DB, dongSchema string) *DonationCampaignFeedRepository {
	return &DonationCampaignFeedRepository{db: db, dongSchema: dongSchema}
}

func (r *DonationCampaignFeedRepository) ListCampaignFeedsByAddress(campaignAddress string, limit int, timestampLt time.Time) ([]*models.DonationCampaignFeed, error) {
	query := fmt.Sprintf(`
        SELECT 
            id, tx_hash, creator_address, related_address,
            title, description, image_cids, parent_hash,
            root_hash, created_at, root_created_at
        FROM (
            SELECT 
                f.*,
                ROW_NUMBER() OVER (
                    PARTITION BY COALESCE(f.root_hash, f.tx_hash)
                    ORDER BY f.created_at DESC
                ) AS rn,
                MIN(f.created_at) OVER (
                    PARTITION BY COALESCE(f.root_hash, f.tx_hash)
                ) AS root_created_at
            FROM %s.user_content f
            WHERE f.related_address = $1
              AND f.type = $2
        ) t
        WHERE rn = 1
          AND root_created_at < $3
        ORDER BY root_created_at DESC
        LIMIT $4;
    `, r.dongSchema)

	rows, err := r.db.Query(query, campaignAddress, FeedTypeDonationCampaign, timestampLt, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list campaign feeds: %w", err)
	}
	defer rows.Close()

	feeds := []*models.DonationCampaignFeed{}

	for rows.Next() {
		var feed models.DonationCampaignFeed

		if err := rows.Scan(
			&feed.ID,
			&feed.TxHash,
			&feed.CreatorAddress,
			&feed.CampaignAddress,
			&feed.Title,
			&feed.Description,
			pq.Array(&feed.ImageCIDs),
			&feed.ParentHash,
			&feed.RootHash,
			&feed.CreatedAt,
			&feed.RootCreatedAt,
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
