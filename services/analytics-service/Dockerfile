FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY pkg ./pkg
COPY services/analytics-service ./services/analytics-service
WORKDIR /app/services/analytics-service
RUN go build -o main ./cmd/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/services/analytics-service/main .
EXPOSE 8003
CMD ["./main"]
