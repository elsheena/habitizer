FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY pkg ./pkg
COPY services/habit-service ./services/habit-service
WORKDIR /app/services/habit-service
RUN go build -o main ./cmd/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/services/habit-service/main .
EXPOSE 8002
CMD ["./main"]
