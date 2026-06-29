FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY pkg ./pkg
COPY services/notification-worker ./services/notification-worker
WORKDIR /app/services/notification-worker
RUN go build -o main ./cmd/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/services/notification-worker/main .
CMD ["./main"]
