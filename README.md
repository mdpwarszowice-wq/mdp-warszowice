# MDP Warszowice — prototyp z Supabase

## Ważne
To jest punkt startowy, a nie system gotowy do użycia z prawdziwymi danymi dzieci. Przed wdrożeniem należy wykonać testy RLS i przegląd bezpieczeństwa. Nie dodawaj danych osobowych, dopóki testy nie zostaną zakończone.

## Konfiguracja
1. W `config.js` wpisz Project URL i Publishable key z Supabase. Nigdy nie używaj klucza `secret` ani `service_role` w przeglądarce.
2. Wgraj wszystkie pliki bezpośrednio do głównego katalogu repozytorium GitHub Pages.
3. Zaloguj się kontem utworzonym w Supabase Authentication.
4. Publiczna rejestracja nie jest obsługiwana przez interfejs.

## Ograniczenia tej wersji
- Opiekun może dodawać członków, zbiórki, obecności i komunikaty, jeśli polityki RLS są poprawnie skonfigurowane.
- Przypisania rodziców i członków trzeba utworzyć bezpieczną procedurą administracyjną.
- Nie ma jeszcze panelu do tworzenia kont rodziców ani przypisywania dzieci.
- Nie ma prawdziwych powiadomień push ani SMS.
- Nie należy uznawać tej wersji za gotową produkcyjnie bez audytu i testów dostępu.


## Motyw graficzny
Wersja zawiera ciemny motyw strażacki, czerwone akcenty, kafelki i menu boczne na komputerze oraz wysuwane menu na telefonie. Funkcje aplikacji i konfiguracja Supabase pozostają w dotychczasowych plikach.
