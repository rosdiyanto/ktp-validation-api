# KTP Image Validation API

API untuk validasi gambar KTP (format, ukuran, dimensi, kecerahan, orientasi).

---

## Persyaratan

- [Docker](https://www.docker.com/get-started) dan [Docker Compose](https://docs.docker.com/compose/install/) sudah terpasang di komputer Anda.

---

## Instalasi dan Menjalankan dengan Docker Compose

1. Clone repository ini:

```bash
git clone <repo-url>
cd <folder-repo>
```

2. Pastikan ada file `docker-compose.yml` di folder project dengan isi:

```yaml
services:
  ktp-validation-api:
    container_name: ktp-validator-container
    build: .
    image: ktp-validator:latest
    ports:
      - "3000:3000"    # Memetakan port 3000 di host ke port 3000 di container
    environment:
      - API_KEY=your_super_secret_api_key   # API key untuk otentikasi akses aplikasi
      - PORT=3000                           # Port yang digunakan oleh aplikasi di container
    restart: unless-stopped

```

3. Jalankan container dengan Docker Compose:

```bash
docker-compose up -d --build
```

4. Akses API di: `http://localhost:3000`

---

## Testing API dengan curl

Untuk menguji endpoint `/validate-ktp` gunakan perintah berikut:

```bash
curl -X POST http://localhost:3000/validate-ktp \
  -H "x-api-key: your_super_secret_api_key" \
  -F "ktpImage=@/path/to/your/image.jpg"
```

Ganti `/path/to/your/image.jpg` dengan path file gambar KTP di komputer Anda.

---

## Menghentikan dan Menghapus Container

- Hentikan container:

```bash
docker-compose down
```

---

## Endpoint API

### POST `/validate-ktp`

- Upload gambar KTP dengan form field `ktpImage` (multipart/form-data).

- Response JSON:

```json
{
  "status": true|false,
  "message": ["Pesan validasi berhasil atau error"]
}
```

---

## Lisensi

MIT License

---

Jika ingin bantuan tambahan, hubungi saya.
