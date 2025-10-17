FROM golang:1.23-alpine AS build

RUN apk add --no-cache git bash gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -o /bin/app -tags=production main.go

FROM alpine:3.18

RUN apk add --no-cache bash

COPY --from=build /bin/app /bin/app

EXPOSE 8080

ENTRYPOINT ["/bin/app"]

CMD []
