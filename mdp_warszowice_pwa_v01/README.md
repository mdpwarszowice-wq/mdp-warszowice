# MDP Warszowice PWA — prototyp 0.1

To jest progresywną aplikacja webowa (PWA): można ją uruchomić w przeglądarce i dodać do ekranu głównego telefonu. Nie wymaga App Store ani Google Play do samego testowania.

## Ważne
- To nadal prototyp interfejsu. Brak prawdziwego logowania, serwera, synchronizacji, push i SMS.
- Dane przykładowe są w pamięci strony i nie stanowią oficjalnej ewidencji.
- Przełączanie ról służy wyłącznie demonstracji; nie jest zabezpieczeniem.
- Nie wpisuj prawdziwych danych dzieci do tej wersji.

## Uruchomienie
PWA musi być hostowana przez HTTPS, aby instalacja i service worker działały prawidłowo. Można wdrożyć ją na darmowym planie statycznego hostingu, np. GitHub Pages, Cloudflare Pages lub Netlify, zależnie od aktualnych limitów.
1. Rozpakuj pliki.
2. Wgraj zawartość folderu do statycznego hostingu z HTTPS.
3. Otwórz adres na telefonie.

## Dodawanie do ekranu głównego
- iPhone: otwórz adres w Safari → Udostępnij → Dodaj do ekranu początkowego.
- Android: otwórz adres w Chrome → menu → Zainstaluj aplikację / Dodaj do ekranu głównego.

## Następny etap
1. Podłączyć Supabase Auth i bazę danych.
2. Wdrożyć RLS i role opiekun/członek/rodzic po stronie serwera.
3. Wprowadzić zaproszenia i potwierdzanie relacji rodzic–dziecko przez opiekuna.
4. Dodać prawdziwe powiadomienia push i ewentualnie SMS przez dostawcę.
5. Przetestować działanie na iOS/Android i polityki prywatności dla danych niepełnoletnich.

## Dźwięk syreny
Ten prototyp nie wysyła powiadomień. Prawdziwy dźwięk push zależy od konfiguracji platformy, uprawnień i ustawień urządzenia; nie można zagwarantować odtworzenia przy wyciszonym telefonie.
