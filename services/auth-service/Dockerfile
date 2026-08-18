FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY pkg ./pkg
COPY services/auth-service ./services/auth-service
WORKDIR /app/services/auth-service
RUN go build -o main ./cmd/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/services/auth-service/main .
EXPOSE 8001
CMD ["./main"]
