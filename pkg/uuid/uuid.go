package uuid

import (
	"crypto/rand"
	"fmt"
	"io"
)

// NewString returns a randomly generated RFC 4122 Version 4 UUID string.
func NewString() string {
	var uuid [16]byte
	_, err := io.ReadFull(rand.Reader, uuid[:])
	if err != nil {
		return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
			randInt(), randInt()&0xffff, 0x4000|(randInt()&0x0fff),
			0x8000|(randInt()&0x3fff), randInt64()&0xffffffffffff)
	}

	// Set version (4) and variant (RFC 4122)
	uuid[6] = (uuid[6] & 0x0f) | 0x40
	uuid[8] = (uuid[8] & 0x3f) | 0x80

	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		uuid[0:4],
		uuid[4:6],
		uuid[6:8],
		uuid[8:10],
		uuid[10:16],
	)
}

func randInt() uint32 {
	var b [4]byte
	_, _ = rand.Read(b[:])
	return uint32(b[0])<<24 | uint32(b[1])<<16 | uint32(b[2])<<8 | uint32(b[3])
}

func randInt64() uint64 {
	var b [8]byte
	_, _ = rand.Read(b[:])
	return uint64(b[0])<<56 | uint64(b[1])<<48 | uint64(b[2])<<40 | uint64(b[3])<<32 |
		uint64(b[4])<<24 | uint64(b[5])<<16 | uint64(b[6])<<8 | uint64(b[7])
}
