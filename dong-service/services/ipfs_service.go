// Reference: https://pkg.go.dev/github.com/ipfs/kubo/client/rpc
// Reference: https://github.com/ipfs/kubo/tree/master/client/rpc
package services

import (
	"context"
	"io"
	"strings"
	files "github.com/ipfs/boxo/files"
	boxopath "github.com/ipfs/boxo/path"
	"github.com/ipfs/kubo/client/rpc"
	iface "github.com/ipfs/kubo/core/coreiface"
	"github.com/ipfs/kubo/core/coreiface/options"
	"github.com/multiformats/go-multiaddr"
	"dong-service/logger"
)

type IPFSService struct {
	client *rpc.HttpApi
}

var IPFS *IPFSService

func InitIPFSService(addr string) error {
    ma, err := multiaddr.NewMultiaddr(addr)
    if err != nil {
        return err
    }
    client, err := rpc.NewApi(ma)
    if err != nil {
        return err
    }
    IPFS = &IPFSService{client: client}
    logger.Info().Str("ipfs_address", addr).Msg("Connected to IPFS node successfully")
    return nil
}

func (s *IPFSService) UploadImagesAsFolder(ctx context.Context, images map[string]io.Reader) (string, map[string]string, error) {
	dirMap := make(map[string]files.Node)
	for name, reader := range images {
		dirMap[name] = files.NewReaderFile(reader)
	}
	dir := files.NewMapDirectory(dirMap)
	p, err := s.client.Unixfs().Add(ctx, dir, options.Unixfs.CidVersion(1), options.Unixfs.RawLeaves(true))
	if err != nil {
		return "", nil, err
	}
	folderCID := strings.TrimPrefix(p.String(), "/ipfs/")
	if err := s.client.Pin().Add(ctx, p); err != nil {
		return "", nil, err
	}
	
	fileCIDs := make(map[string]string)
	pth, err := boxopath.NewPath("/ipfs/" + folderCID)
    if err != nil {
        return folderCID, nil, err
    }
	ch := make(chan iface.DirEntry, 10)
	err = s.client.Unixfs().Ls(ctx, pth, ch)
	if err != nil {
		return folderCID, nil, err
	}
	for entry := range ch {
		if entry.Name == "" {
			continue
		}
		fileCIDs[entry.Name] = entry.Cid.String()
	}
	return folderCID, fileCIDs, nil
}