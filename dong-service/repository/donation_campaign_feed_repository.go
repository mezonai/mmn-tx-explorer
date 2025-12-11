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

func (r *DonationCampaignFeedRepository) ListCampaignFeedsByAddress(campaignAddress string, limit int, timestampLt time.Time, userAddress string) ([]*models.DonationCampaignFeed, error) {
	var userAddressParam interface{}
	if userAddress != "" {
		userAddressParam = userAddress
	} else {
		userAddressParam = nil
	}

	query := fmt.Sprintf(`
        SELECT 
			id, tx_hash, creator_address, related_address,
			title, description, image_cids, parent_hash,
			root_hash, visible, created_at, root_created_at
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
			WHERE 
				f.related_address = $1
				AND f.type = $2
				AND (
						($5::text IS NOT NULL AND f.creator_address = $5::text)
						OR f.visible = TRUE
					)
		) t
		WHERE 
			rn = 1
			AND root_created_at < $3
		ORDER BY root_created_at DESC
		LIMIT $4;
    `, r.dongSchema)

	rows, err := r.db.Query(query, campaignAddress, FeedTypeDonationCampaign, timestampLt, limit, userAddressParam)
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
			&feed.Visible,
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

func (r *DonationCampaignFeedRepository) FindCampaignFeedByHash(feedHash string) (*models.DonationCampaignFeed, error) {
	query := fmt.Sprintf(`
		SELECT 
			id, tx_hash, creator_address, related_address,
			title, description, image_cids, parent_hash,
			root_hash, visible, created_at
		FROM %s.user_content
		WHERE tx_hash = $1;
	`, r.dongSchema)

	var feed models.DonationCampaignFeed
	err := r.db.QueryRow(query, feedHash).Scan(
		&feed.ID,
		&feed.TxHash,
		&feed.CreatorAddress,
		&feed.CampaignAddress,
		&feed.Title,
		&feed.Description,
		pq.Array(&feed.ImageCIDs),
		&feed.ParentHash,
		&feed.RootHash,
		&feed.Visible,
		&feed.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find campaign feed by hash: %w", err)
	}

	return &feed, nil
}

func (r *DonationCampaignFeedRepository) UpdateVisibleFeed(feedHash string, req *models.UpdateVisibleFeedRequest) error {
	query := fmt.Sprintf(`
		UPDATE %s.user_content
		SET visible = $2
		WHERE 
			root_hash = $1 OR tx_hash = $1;
	`, r.dongSchema)

	_, err := r.db.Exec(query, feedHash, req.Visible)
	if err != nil {
		return fmt.Errorf("failed to update visible feed: %w", err)
	}

	return nil
}

func (r *DonationCampaignFeedRepository) ListHistoryFeedsByRootHash(rootFeedHash string) ([]*models.DonationCampaignFeed, error) {
	query := fmt.Sprintf(`
		SELECT
			id, tx_hash, creator_address, related_address,
			title, description, image_cids, parent_hash,
			root_hash, visible, created_at
		FROM %s.user_content
		WHERE 
			root_hash = $1 OR tx_hash = $1
		ORDER BY created_at DESC;
	`, r.dongSchema)
	rows, err := r.db.Query(query, rootFeedHash)
	if err != nil {
		return nil, fmt.Errorf("failed to list previous feeds by root hash: %w", err)
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
			&feed.Visible,
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
