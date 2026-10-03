-- Demo seed. All accounts use the password: pisanielistow
create function public._seed_user(
  p_id uuid, p_email text, p_name text, p_age public.age_range, p_channel public.channel,
  p_city text, p_address text, p_bio text, p_interests text[], p_languages text[] default '{polski}'
) returns void language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('pisanielistow', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true), 'email', now(), now(), now());
  -- profiles / private_profiles rows were created by the on_auth_user_created trigger
  update public.profiles set name = p_name, age_range = p_age, channel = p_channel, bio = p_bio,
    interests = p_interests, languages = p_languages where id = p_id;
  update public.private_profiles set city = p_city, postal_address = p_address where id = p_id;
end $$;

select public._seed_user('00000000-0000-0000-0000-000000000101', 'kuba@penpal.test', 'Kuba', '18-25', 'APP',
  'Kraków', 'ul. Długa 5/3, 31-147 Kraków',
  'Studiuję historię. Lubię stare zdjęcia Krakowa i podróże pociągiem. Chętnie posłucham, jak kiedyś wyglądało życie.',
  '{Książki,Historia,Podróże,Fotografia}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000102', 'ola@penpal.test', 'Ola', '18-25', 'APP',
  'Kraków', 'ul. Szkolna 2, 30-001 Kraków',
  'Jestem w drużynie harcerskiej, robimy projekt o historii Krakowa.',
  '{Historia,Muzyka,Rękodzieło,Przyroda}');
select public._seed_user('00000000-0000-0000-0000-000000000201', 'halina@penpal.test', 'Halina', '60-75', 'PAPER',
  'Kraków', 'ul. Lipowa 7/2, 30-702 Kraków',
  'Emerytowana polonistka. Lubię wspominać i słuchać.',
  '{Książki,Historia,Ogród,Gotowanie}');
select public._seed_user('00000000-0000-0000-0000-000000000202', 'tadeusz@penpal.test', 'Tadeusz', '75+', 'PAPER',
  'Kraków', 'ul. Józefa 14/1, 31-056 Kraków',
  'Przez 50 lat fotografowałem Kraków. Chętnie opowiem, jak wyglądał Kazimierz, gdy byłem młody.',
  '{Fotografia,Historia,Szachy i gry}');
select public._seed_user('00000000-0000-0000-0000-000000000203', 'krystyna@penpal.test', 'Krystyna', '60-75', 'APP',
  'Kraków', 'ul. Kolejowa 3/9, 31-000 Kraków',
  'Zwiedziłam pół Europy pociągiem.',
  '{Podróże,Książki,Języki obce}', '{polski,niemiecki}');
select public._seed_user('00000000-0000-0000-0000-000000000204', 'zofia@penpal.test', 'Zofia', '60-75', 'PAPER',
  'Kraków', 'ul. Ogrodowa 11, 30-500 Kraków',
  'Hoduję pomidory na balkonie i piekę najlepszy sernik na Podgórzu.',
  '{Ogród,Gotowanie,Muzyka,Książki}');
select public._seed_user('00000000-0000-0000-0000-000000000205', 'stanislaw@penpal.test', 'Stanisław', '75+', 'PAPER',
  'Kraków', 'os. Centrum A 4/12, 31-923 Kraków',
  'Grałem na trąbce w orkiestrze huty. Kibicuję Wiśle od zawsze.',
  '{Historia,Muzyka,Sport,Podróże}');
select public._seed_user('00000000-0000-0000-0000-000000000206', 'barbara@penpal.test', 'Barbara', '75+', 'PAPER',
  'Tarnów', 'ul. Wałowa 1, 33-100 Tarnów',
  'Robię na drutach i oglądam stare filmy.',
  '{Rękodzieło,Przyroda,Film}');


-- Presentation users: 20 seniors (…0300–0319) and 20 young people (…0400–0419), password pisanielistow
select public._seed_user('00000000-0000-0000-0000-000000000300', 'irena.s01@penpal.test', 'Irena', '60-75', 'PAPER',
  'Kraków', 'ul. Karmelicka 12/4, 31-128 Kraków',
  'Byłam bibliotekarką. Najchętniej rozmawiam o książkach i kwiatach.',
  '{Książki,Ogród,Historia}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000301', 'jozef.s02@penpal.test', 'Józef', '75+', 'PAPER',
  'Kraków', 'ul. Mogilska 40/7, 31-546 Kraków',
  'Całe życie pracowałem na kolei. Znam każdą stację w Małopolsce.',
  '{Podróże,Historia,Technologia}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000302', 'danuta.s03@penpal.test', 'Danuta', '60-75', 'APP',
  'Kraków', 'os. Kalinowe 3/12, 31-812 Kraków',
  'Wnuczka nauczyła mnie smartfona. Lubię gotować i piec ciasta.',
  '{Gotowanie,Zwierzęta,Muzyka}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000303', 'henryk.s04@penpal.test', 'Henryk', '75+', 'PAPER',
  'Wieliczka', 'ul. Słowackiego 5, 32-020 Wieliczka',
  'Grałem w szachy w klubie przez czterdzieści lat. Szukam godnego przeciwnika listownie.',
  '{Szachy i gry,Historia,Sport}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000304', 'teresa.s05@penpal.test', 'Teresa', '60-75', 'PAPER',
  'Kraków', 'ul. Grodzka 33/2, 31-001 Kraków',
  'Szyję, haftuję i opowiadam o dawnym Kazimierzu.',
  '{Rękodzieło,Historia,Film}', '{polski,niemiecki}');
select public._seed_user('00000000-0000-0000-0000-000000000305', 'wladyslaw.s06@penpal.test', 'Władysław', '75+', 'PAPER',
  'Kraków', 'ul. Lea 120/5, 30-133 Kraków',
  'Uczyłem fizyki. Ciekawi mnie, jak dziś wygląda technologia.',
  '{Technologia,Książki,Przyroda}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000306', 'maria.s07@penpal.test', 'Maria', '60-75', 'APP',
  'Kraków', 'ul. Wielicka 58/9, 30-552 Kraków',
  'Śpiewam w chórze parafialnym i kocham stare przeboje.',
  '{Muzyka,Gotowanie,Ogród}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000307', 'zbigniew.s08@penpal.test', 'Zbigniew', '60-75', 'PAPER',
  'Tarnów', 'ul. Krakowska 15, 33-100 Tarnów',
  'Wędkarz i grzybiarz. Najlepiej czuję się w lesie.',
  '{Przyroda,Sport,Zwierzęta}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000308', 'elzbieta.s09@penpal.test', 'Elżbieta', '75+', 'PAPER',
  'Kraków', 'ul. Dietla 70/3, 31-039 Kraków',
  'Byłam aktorką teatru amatorskiego. Chętnie opowiem o kinie lat 60.',
  '{Film,Muzyka,Książki}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000309', 'ryszard.s10@penpal.test', 'Ryszard', '60-75', 'APP',
  'Kraków', 'os. Teatralne 8/21, 31-946 Kraków',
  'Inżynier z Nowej Huty. Majsterkuję i fotografuję zachody słońca.',
  '{Fotografia,Technologia,Historia}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000310', 'wanda.s11@penpal.test', 'Wanda', '75+', 'PAPER',
  'Myślenice', 'ul. Rynek 9, 32-400 Myślenice',
  'Mam ogród pełen róż i trzy koty. Lubię długie listy.',
  '{Ogród,Zwierzęta,Rękodzieło}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000311', 'kazimierz.s12@penpal.test', 'Kazimierz', '75+', 'PAPER',
  'Kraków', 'ul. Starowiślna 22/1, 31-032 Kraków',
  'Pamiętam Kraków sprzed tramwajów niskopodłogowych. Opowiem, jak było.',
  '{Historia,Podróże,Fotografia}', '{polski,ukraiński}');
select public._seed_user('00000000-0000-0000-0000-000000000312', 'jadwiga.s13@penpal.test', 'Jadwiga', '60-75', 'APP',
  'Kraków', 'ul. Zakopiańska 105/6, 30-418 Kraków',
  'Uczyłam angielskiego. Chętnie napiszę też po angielsku.',
  '{Języki obce,Książki,Podróże}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000313', 'tadeusz.s14@penpal.test', 'Tadeusz', '60-75', 'PAPER',
  'Bochnia', 'ul. Kazimierza Wielkiego 4, 32-700 Bochnia',
  'Przez lata byłem górnikiem w kopalni soli. Lubię piłkę nożną.',
  '{Sport,Historia,Muzyka}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000314', 'anna.s15@penpal.test', 'Anna', '75+', 'PAPER',
  'Kraków', 'ul. Kalwaryjska 31/8, 30-504 Kraków',
  'Kolekcjonuję przepisy babci. Każdy list kończę przepisem.',
  '{Gotowanie,Rękodzieło,Ogród}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000315', 'edward.s16@penpal.test', 'Edward', '75+', 'APP',
  'Kraków', 'ul. Piastowska 47/2, 30-067 Kraków',
  'Byłem żeglarzem. Opłynąłem Bałtyk i lubię opowiadać o morzu.',
  '{Podróże,Przyroda,Fotografia}', '{polski,niemiecki}');
select public._seed_user('00000000-0000-0000-0000-000000000316', 'halina.s17@penpal.test', 'Halina', '60-75', 'PAPER',
  'Nowy Targ', 'ul. Szaflarska 18, 34-400 Nowy Targ',
  'Góralka z dziada pradziada. Robię oscypki i kocham Tatry.',
  '{Przyroda,Gotowanie,Muzyka}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000317', 'leszek.s18@penpal.test', 'Leszek', '60-75', 'APP',
  'Kraków', 'ul. Królewska 66/14, 30-081 Kraków',
  'Grałem na gitarze w zespole big-beatowym. Rock and roll wciąż we mnie gra.',
  '{Muzyka,Film,Technologia}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000318', 'genowefa.s19@penpal.test', 'Genowefa', '75+', 'PAPER',
  'Kraków', 'ul. Bronowicka 90/1, 30-091 Kraków',
  'Wychowałam pięcioro dzieci i dziesięcioro wnucząt. Lubię słuchać młodych.',
  '{Rękodzieło,Zwierzęta,Książki}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000319', 'stefan.s20@penpal.test', 'Stefan', '75+', 'PAPER',
  'Olkusz', 'ul. Rabsztyńska 2, 32-300 Olkusz',
  'Emerytowany listonosz. Listy to moja pasja od zawsze.',
  '{Historia,Szachy i gry,Przyroda}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000400', 'zuzia.m01@penpal.test', 'Zuzia', '18-25', 'APP',
  'Kraków', 'ul. Pawia 10/2, 31-154 Kraków',
  'Studiuję polonistykę. Szukam kogoś, kto pamięta dawne czasy.',
  '{Książki,Historia,Film}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000401', 'mateusz.m02@penpal.test', 'Mateusz', '18-25', 'APP',
  'Kraków', 'ul. Czarnowiejska 50/3, 30-054 Kraków',
  'Student AGH. Interesuje mnie, jak kiedyś działała technika.',
  '{Technologia,Historia,Szachy i gry}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000402', 'julia.m03@penpal.test', 'Julia', '18-25', 'APP',
  'Kraków', 'ul. Lubicz 25/7, 31-503 Kraków',
  'Uczę się gotować i chętnie poznam stare przepisy.',
  '{Gotowanie,Ogród,Rękodzieło}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000403', 'kacper.m04@penpal.test', 'Kacper', '18-25', 'APP',
  'Wieliczka', 'ul. Asnyka 3, 32-020 Wieliczka',
  'Gram w piłkę i interesuję się historią sportu.',
  '{Sport,Historia,Podróże}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000404', 'natalia.m05@penpal.test', 'Natalia', '18-25', 'PAPER',
  'Kraków', 'ul. Smolki 14/1, 30-513 Kraków',
  'Lubię pisać listy ręcznie. Zbieram znaczki i pocztówki.',
  '{Historia,Rękodzieło,Fotografia}', '{polski,niemiecki}');
select public._seed_user('00000000-0000-0000-0000-000000000405', 'szymon.m06@penpal.test', 'Szymon', '18-25', 'APP',
  'Kraków', 'os. Złotej Jesieni 7/40, 31-826 Kraków',
  'Fotografuję Kraków nocą. Chcę zobaczyć, jak zmieniało się miasto.',
  '{Fotografia,Historia,Podróże}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000406', 'wiktoria.m07@penpal.test', 'Wiktoria', '18-25', 'APP',
  'Tarnów', 'ul. Wałowa 12, 33-100 Tarnów',
  'Studiuję muzykę. Ciekawi mnie, czego słuchało się dawniej.',
  '{Muzyka,Film,Książki}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000407', 'jakub.m08@penpal.test', 'Jakub', '18-25', 'APP',
  'Kraków', 'ul. Prądnicka 80/9, 31-202 Kraków',
  'Wolontariusz w schronisku. Kocham psy i długie spacery.',
  '{Zwierzęta,Przyroda,Sport}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000408', 'maja.m09@penpal.test', 'Maja', '18-25', 'APP',
  'Kraków', 'ul. Krowoderska 42/5, 31-158 Kraków',
  'Uczę się ukraińskiego i angielskiego. Lubię podróże koleją.',
  '{Języki obce,Podróże,Książki}', '{polski,ukraiński,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000409', 'filip.m10@penpal.test', 'Filip', '18-25', 'APP',
  'Bochnia', 'ul. Solna 6, 32-700 Bochnia',
  'Gram w szachy online. Chętnie zagram partię korespondencyjną.',
  '{Szachy i gry,Technologia,Historia}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000410', 'oliwia.m11@penpal.test', 'Oliwia', '18-25', 'PAPER',
  'Kraków', 'ul. Józefińska 19/4, 30-529 Kraków',
  'Szyję ubrania i robię na drutach. Szukam mistrzyni robótek.',
  '{Rękodzieło,Film,Muzyka}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000411', 'bartek.m12@penpal.test', 'Bartek', '18-25', 'APP',
  'Kraków', 'ul. Bulwarowa 35/11, 31-751 Kraków',
  'Studiuję historię Nowej Huty. Szukam świadków dawnych lat.',
  '{Historia,Fotografia,Technologia}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000412', 'lena.m13@penpal.test', 'Lena', '18-25', 'APP',
  'Nowy Targ', 'ul. Ludźmierska 21, 34-400 Nowy Targ',
  'Chodzę po górach co weekend. Lubię przyrodę i zwierzęta.',
  '{Przyroda,Zwierzęta,Sport}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000413', 'igor.m14@penpal.test', 'Igor', '18-25', 'APP',
  'Kraków', 'ul. Wrocławska 64/8, 30-011 Kraków',
  'Programista i fan starych filmów science fiction.',
  '{Technologia,Film,Muzyka}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000414', 'amelia.m15@penpal.test', 'Amelia', '18-25', 'APP',
  'Kraków', 'ul. Mazowiecka 15/6, 30-036 Kraków',
  'Studiuję architekturę krajobrazu. Uwielbiam ogrody.',
  '{Ogród,Przyroda,Fotografia}', '{polski,niemiecki}');
select public._seed_user('00000000-0000-0000-0000-000000000415', 'dawid.m16@penpal.test', 'Dawid', '18-25', 'APP',
  'Myślenice', 'ul. Słowackiego 11, 32-400 Myślenice',
  'Jeżdżę na rowerze i zbieram historie z okolicy.',
  '{Sport,Historia,Przyroda}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000416', 'hania.m17@penpal.test', 'Hania', '18-25', 'PAPER',
  'Kraków', 'ul. Szlak 28/3, 31-153 Kraków',
  'Piszę wiersze i lubię klasyczne powieści.',
  '{Książki,Muzyka,Rękodzieło}', '{polski}');
select public._seed_user('00000000-0000-0000-0000-000000000417', 'michal.m18@penpal.test', 'Michał', '18-25', 'APP',
  'Olkusz', 'ul. Króla Kazimierza 7, 32-300 Olkusz',
  'Gotuję dla całej rodziny. Chcę poznać przepisy sprzed lat.',
  '{Gotowanie,Podróże,Języki obce}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000418', 'ania.m19@penpal.test', 'Ania', '18-25', 'APP',
  'Kraków', 'ul. Basztowa 3/12, 31-134 Kraków',
  'Studiuję psychologię. Lubię słuchać i rozmawiać o życiu.',
  '{Książki,Film,Podróże}', '{polski,angielski}');
select public._seed_user('00000000-0000-0000-0000-000000000419', 'tymon.m20@penpal.test', 'Tymon', '18-25', 'APP',
  'Kraków', 'ul. Nowosądecka 52/17, 30-383 Kraków',
  'Kolekcjonuję winyle. Najchętniej porozmawiam o muzyce.',
  '{Muzyka,Historia,Fotografia}', '{polski}');

drop function public._seed_user;

-- Pairings (user_a_id = inviter)
insert into public.pairings (id, user_a_id, user_b_id, pal_kod, status, created_at) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'PP-7K3D', 'ACTIVE', now() - interval '30 days'),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202', 'PP-4MWR', 'ACTIVE', now() - interval '20 days'),
  ('00000000-0000-0000-0000-00000000a003', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000101', 'PP-9XQT', 'INVITED', now() - interval '1 day');

-- Letters, relative to now() so the demo always looks fresh
insert into public.letters (pairing_id, sender_id, kind, body, delivery_channel, sent_at, deliver_at, read_at) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000201', 'TYPED',
   E'Drogi Kubo,\n\nnazywam się Halina i przez czterdzieści lat uczyłam polskiego. Cieszę się, że będziemy do siebie pisać.\n\nCo lubisz czytać?',
   'APP', now() - interval '23 days', now() - interval '21 days', now() - interval '21 days'),
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000101', 'TYPED',
   E'Droga Halino,\n\ndziękuję za list! Wysyłam Ci zdjęcie Wisły o świcie. Jaka jest Twoja ulubiona książka?',
   'PAPER', now() - interval '11 days', now() - interval '9 days', null),
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000000201', 'TYPED',
   E'Kraków, 28 września\n\nDrogi Kubo,\n\ndziękuję Ci za list i za zdjęcie Wisły o świcie. Przypomniało mi lato 1968, kiedy z siostrą pływałyśmy łódką aż pod Tyniec.\n\nPytałeś o ulubioną książkę — to „Lalka”. Czytałam ją trzy razy i za każdym razem kibicowałam komuś innemu.\n\nA Ty co teraz czytasz?',
   'APP', now() - interval '4 days', now() - interval '2 days', null),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-000000000101', 'TYPED',
   E'Drogi Tadeuszu,\n\nczy pamiętasz, jak wyglądał plac Nowy w latach sześćdziesiątych?',
   'PAPER', now() - interval '6 hours', now() + interval '2 days' - interval '6 hours', null);

-- Kraków points (fictional names, real coordinates)
insert into public.points (type, name, address, lat, lng, hours, can_send, can_collect, pickup_note, phone) values
  ('PALPOINT', 'Klub Seniora „Pod Lipami”', 'ul. Przykładowa 12, Kraków', 50.0536, 19.9349,
   '[null,["10:00","18:00"],["10:00","18:00"],["10:00","18:00"],["10:00","18:00"],["10:00","18:00"],["10:00","14:00"]]',
   true, true, 'Listy skanujemy codziennie o 17:00.', '+48120000001'),
  ('PALPOINT', 'Biblioteka „Pod Arkadami”', 'ul. Książkowa 3, Kraków', 50.0647, 19.9450,
   '[null,["09:00","19:00"],["09:00","19:00"],["09:00","19:00"],["09:00","19:00"],["09:00","19:00"],["10:00","15:00"]]',
   true, true, 'Listy skanujemy codziennie o 18:00.', '+48120000002'),
  ('PALPOINT', 'Kawiarnia „Pocztówka”', 'ul. Kawowa 8, Kraków', 50.0672, 19.9205,
   '[["10:00","16:00"],["08:00","20:00"],["08:00","20:00"],["08:00","20:00"],["08:00","20:00"],["08:00","20:00"],["09:00","20:00"]]',
   true, false, 'Listy odbieramy codziennie o 16:00.', '+48120000003'),
  ('PALPOINT', 'Dom Kultury „Dębniki”', 'ul. Kulturalna 21, Kraków', 50.0478, 19.9187,
   '[null,["12:00","20:00"],["12:00","20:00"],["12:00","20:00"],["12:00","20:00"],["12:00","20:00"],null]',
   true, true, 'Listy skanujemy codziennie o 19:00.', '+48120000004'),
  ('PALBOX', 'PalBox Rynek Podgórski', 'Rynek Podgórski, Kraków', 50.0443, 19.9495,
   '[["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"]]',
   true, false, 'Opróżniamy codziennie o 15:00.', null),
  ('PALBOX', 'PalBox Kazimierz', 'pl. Nowy, Kraków', 50.0515, 19.9447,
   '[["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"]]',
   true, false, 'Opróżniamy codziennie o 16:00.', null),
  ('PALBOX', 'PalBox Nowa Huta', 'os. Centrum A, Kraków', 50.0717, 20.0377,
   '[["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"],["00:00","24:00"]]',
   true, false, 'Opróżniamy codziennie o 14:00.', null);
