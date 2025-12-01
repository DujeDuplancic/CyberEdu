# 🛡️ CyberEdu - CTF Platforma za Učenje

CyberEdu je moderna web platforma za učenje cyber sigurnosti kroz CTF (Capture The Flag) izazove. Platforma omogućava korisnicima da rješavaju različite sigurnosne izazove, napreduju kroz rang listu i uče praktične vještine.

![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)

## ✨ Značajke

### 🎯 Za Učenike
- **Interaktivni Izazovi** - Web, kriptografija, forenzika, reverse engineering i ostali izazovi
- **Praćenje Napretka** - Pratite svoj napredak u realnom vremenu
- **Bodovni i Rang Sustav** - Natječite se s drugim učenicima
- **Kategorizirano Učenje** - Fokus na specifične sigurnosne domene
- **Sustav Postignuća** - Otključajte bedževe i postignuća

### 🛠️ Za Administratore/Edukatore
- **Upravljanje Izazovima** - Kreirajte, uredite i upravljajte izazovima
- **Korisnički Dashboard** - Pratite napredak učenika
- **Analitika** - Detaljni izvještaji o rješavanju izazova
- **Kategorije i Težine** - Organizirajte izazove po kategorijama i težinama

## 🚀 Instalacija i Pokretanje

### Preduvjeti
- PHP 7.4+
- MySQL 5.7+
- Node.js 16+
- Composer (za PHP dependencie)

### 1. Klonirajte repozitorij
```bash
git clone https://github.com/DujeDuplancic/CyberEdu.git
cd CyberEdu
```

### 2. Backend Postavka
```bash
cd Backend

# Instalirajte PHP dependencie
composer install

# Konfigurirajte bazu podataka
# Uredite config/database.php sa svojim podacima

# Importujte bazu podataka
mysql -u username -p database_name < database/schema.sql
```

### 3. Frontend Postavka
```bash
cd ../Frontend

# Instalirajte Node.js dependencie
npm install

# Pokrenite development server
npm run dev
```

### 4. Konfiguracija
Napravite `.env` fajlove:
- `Backend/.env` - za PHP backend
- `Frontend/.env` - za React frontend

## 📊 Baza Podataka

### Glavne Tabele
```sql
-- Korisnici
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    points INT DEFAULT 0,
    rank INT DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Izazovi
CREATE TABLE challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    description TEXT,
    category_id INT,
    difficulty ENUM('Easy', 'Medium', 'Hard'),
    points INT,
    flag VARCHAR(255)
);

-- Riješeni izazovi
CREATE TABLE solves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    challenge_id INT,
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎮 Korištenje Platforme

### Za Učenike
1. **Registracija** - Kreirajte račun
2. **Pregled Izazova** - Pregledajte dostupne izazove po kategorijama
3. **Rješavanje** - Pokušajte riješiti izazove i unijeti flagove
4. **Pratite Napredak** - Gledajte svoj rank i bodove

### Za Administratore
1. **Admin Dashboard** - Pristupite admin panelu
2. **Upravljanje Izazovima** - Dodajte nove ili uredite postojeće izazove
3. **Upravljanje Korisnicima** - Pregledajte i upravljajte korisničkim računima

## 🔧 API Endpointi

### Autentifikacija
- `POST /auth/register` - Registracija novog korisnika
- `POST /auth/login` - Prijava korisnika
- `POST /auth/logout` - Odjava korisnika

### Izazovi
- `GET /api/challenges` - Dohvati sve izazove
- `GET /api/challenges/{id}` - Dohvati specifični izazov
- `POST /api/challenges/{id}/submit` - Pošalji rješenje

### Profil
- `GET /api/profile/{id}` - Dohvati korisnički profil
- `GET /api/leaderboard` - Dohvati rang listu

## 👥 Doprinos Projektu

Doprinosi su dobrodošli! Molimo vas da pratite ove korake:

1. Fork repozitorij
2. Kreirajte feature granu (`git checkout -b feature/Novo`)
3. Commit-ajte promjene (`git commit -m 'Dodajem novu funkcionalnost'`)
4. Push-ajte granu (`git push origin feature/Novo`)
5. Otvorite Pull Request

### Smjernice za Kod
- Koristite JavaScript za frontend
- Pratite PSR standarde za PHP
- Napišite testove za novu funkcionalnost
- Ažurirajte dokumentaciju

## 📝 Licenca

Ovaj projekt je licenciran pod MIT licencom - pogledajte [LICENSE](LICENSE) fajl za detalje.

## 🤝 Kontakt

- **Autor**: Duje Duplančić
- **GitHub**: [@DujeDuplancic](https://github.com/DujeDuplancic)
- **Email**: [duje.duplancic@gmail.com]

## 🙏 Zahvale

- Svim doprinositeljima koji su pomogli u razvoju
- Open-source zajednici za odlične alate i biblioteke
- CTF zajednici za inspiraciju i izazove

---

⭐ Ako vam se sviđa ovaj projekt, ostavite zvjezdicu na GitHub-u!

---

**Napomena**: Ova platforma je namijenjena isključivo za edukativne svrhe. Koristite stečeno znanje odgovorno i etički
