FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY pkg ./pkg
COPY gateway ./gateway
WORKDIR /app/gateway
RUN go build -o main ./cmd/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/gateway/main .
COPY web ./web
EXPOSE 8000
CMD ["./main"]
