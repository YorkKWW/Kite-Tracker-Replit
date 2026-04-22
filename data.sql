--
-- PostgreSQL database dump
--

\restrict UuG6It59fJwnR0KPQmaH3j1X34zHNHJP9s1QHEDJQFflLISedPstF55LH5Xp8G9

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: accessory_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessory_categories (id, name, has_sizes, is_default, sort_order) FROM stdin;
1	Impact Vest	t	t	10
2	Helmet	t	t	20
3	Wetsuit	t	t	30
4	Waist Harness	t	t	40
5	Seat Harness	t	t	41
6	Pump	f	t	50
\.


--
-- Data for Name: stations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stations (id, name, location, country, is_virtual, sort_order) FROM stdin;
9	Dakhla	Dakhla	Morocco	f	1
8	Tatajuba	Tatajuba	Brazil	f	2
4	Office Hamburg Warehouse	Hamburg	Germany	f	3
6	Service Center Heidenau	Heidenau	Germany	f	4
10	In Transfer	\N	\N	t	6
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, role, assigned_station_id, is_super_admin, can_edit_equipment) FROM stdin;
1	Admin	admin@kitetracker.com	f17a0f5870c5b2240877e3aded647690db2c8a3a4b8836ec37431a5f42099f5dbb51309c8280b9e73431aee86d9d2dc7eabb1a820cd70fef64a384a68abc9a69.8aa8219be47b1d4ad31fea0f6115c98a	admin	\N	t	f
4	Test User	testuser@example.com	6f18a858d5d576ebc695482ea68bf0faf6a572003ee609fbc602788d91581f9c91e6bf7a25fd91a954db52a3193495ab7c01fcc5172c3daf66bc950faa0f8994.d3bfe62618854b85aca1d6b169d9a067	manager	\N	f	f
5	Test User	york@kiteworldwide.com	eafb6064f86909e2434563a6773bc6d9b165c74324cfa1cd8191374c26d57d89777a718ef9fd8e8f444d7d3808d42ac5c9d9d611202b6d3819a1a07077d70e35.701ee488915bc7ebe45b823f5d6384fb	admin	\N	t	f
6	André Peschka	andre@kiteworldwide.com	01489c613d0db27e5e4927f163f93e8cac2754dc0162f984f1a124500774878f2f843ee3cb374a5558ee9bf48fb04660c50e5ffc9592b7ab2f090913ecac627c.8249042c6993c9ff6cbe6da61fe0db98	admin	\N	t	t
\.


--
-- Data for Name: accessory_checks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessory_checks (id, station_id, checked_by, checked_at, total_categories, total_differences) FROM stdin;
\.


--
-- Data for Name: accessory_check_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessory_check_items (id, check_id, category_id, size, target_quantity, actual_quantity, notes) FROM stdin;
\.


--
-- Data for Name: accessory_inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessory_inventory (id, category_id, station_id, size, quantity, updated_at) FROM stdin;
1	1	9	XS	3	2026-03-17 22:39:41.132885
2	1	9	S	5	2026-03-17 22:39:41.137141
3	1	9	M	8	2026-03-17 22:39:41.140106
4	1	9	L	6	2026-03-17 22:39:41.142332
5	1	9	XL	4	2026-03-17 22:39:41.145073
6	2	9	S	6	2026-03-17 22:39:41.148074
7	2	9	M	8	2026-03-17 22:39:41.150488
8	2	9	L	5	2026-03-17 22:39:41.162986
9	3	9	XS/S	3	2026-03-17 22:39:41.165876
10	3	9	S/M	5	2026-03-17 22:39:41.168929
11	3	9	M/L	6	2026-03-17 22:39:41.171187
12	3	9	L/XL	4	2026-03-17 22:39:41.17412
13	4	9	XS	2	2026-03-17 22:39:41.17723
14	4	9	S	4	2026-03-17 22:39:41.1798
15	4	9	M	6	2026-03-17 22:39:41.182603
16	4	9	L	4	2026-03-17 22:39:41.194028
17	4	9	XL	2	2026-03-17 22:39:41.197208
18	6	9	Standard	12	2026-03-17 22:39:41.200077
19	1	8	S	4	2026-03-17 22:39:41.202809
20	1	8	M	6	2026-03-17 22:39:41.205535
21	1	8	L	4	2026-03-17 22:39:41.208887
22	2	8	S	5	2026-03-17 22:39:41.21181
23	2	8	M	6	2026-03-17 22:39:41.21464
24	2	8	L	3	2026-03-17 22:39:41.217565
25	3	8	S/M	4	2026-03-17 22:39:41.220811
26	3	8	M/L	5	2026-03-17 22:39:41.223679
27	4	8	S	3	2026-03-17 22:39:41.22656
28	4	8	M	4	2026-03-17 22:39:41.229453
29	4	8	L	3	2026-03-17 22:39:41.232588
30	6	8	Standard	8	2026-03-17 22:39:41.235373
\.


--
-- Data for Name: accessory_loss_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessory_loss_reports (id, category_id, station_id, size, quantity, reason, reported_by, reported_at, status, resolved_by, resolved_at, admin_note) FROM stdin;
\.


--
-- Data for Name: accessory_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessory_transfers (id, category_id, size, quantity, from_station_id, to_station_id, transferred_by, transferred_at) FROM stdin;
\.


--
-- Data for Name: price_lists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_lists (id, supplier, uploaded_at, item_count, is_active, uploaded_by, valid_from, valid_to, name) FROM stdin;
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment (id, serial_number, type, brand, model, year_of_purchase, current_station_id, status, condition_rating, last_inspection_date, notes, purchase_price, current_value, sale_price, type_specific_fields, created_at, sku, invoice_id, invoice_reference, purchase_date, price_list_id) FROM stdin;
1	KNX415BBA4058192	kite	Core	CORE Nexus 4 15.0 black/black	2024	\N	active	5	\N	\N	994.95	994.95	\N	{"size": "15.0", "color": ""}	2026-03-10 18:36:12.93131	KNX415BBN	\N	\N	2024-08-23 00:00:00	\N
8	X51332106006	board	Core	CORE Fusion 5 133x39	2022	\N	active	5	\N	\N	461.45	461.45	\N	{"size": "133", "color": ""}	2026-03-10 18:42:07.393041	BOBOF513339N	\N	\N	2022-04-26 00:00:00	\N
2	AUTO-BAR_LINES-1773167772935	bar_lines	Core	CORE Sensor 3 & 3S Safety Line	2024	\N	active	5	\N	\N	12.60	12.60	\N	{"size": "3", "color": ""}	2026-03-10 18:36:12.938286	RZSEN3SAFETYLINE	\N	\N	2024-08-23 00:00:00	\N
3	AUTO-BAR_LINES-1773167772941	bar_lines	Core	CORE Sensor 3-4 Bar Inserts, white	2024	\N	active	5	\N	\N	6.55	6.55	\N	{"size": "", "color": ""}	2026-03-10 18:36:12.941911	RZSEN3BARINSERTW	\N	\N	2024-08-23 00:00:00	\N
4	KGS605WBA0064951	kite	Core	CORE GTS6 5.0 white/black	2022	\N	active	5	\N	\N	549.45	549.45	\N	{"size": "5.0", "color": ""}	2026-03-10 18:42:07.291406	KGS605WBN	\N	\N	2022-04-26 00:00:00	\N
5	KGS608WBA1043452	kite	Core	CORE GTS6 8.0 white/black	2022	\N	active	5	\N	\N	659.45	659.45	\N	{"size": "8.0", "color": ""}	2026-03-10 18:42:07.317495	KGS608WBN	\N	\N	2022-04-26 00:00:00	\N
6	RSE3WE60497K23	bar_lines	Core	CORE Sensor 3 Pro Wake Control Bar	2022	\N	active	5	\N	\N	334.95	334.95	\N	{"size": "3", "color": ""}	2026-03-10 18:42:07.330515	RSE3WN	\N	\N	2022-04-26 00:00:00	\N
7	RSE3WE60463K23	bar_lines	Core	CORE Sensor 3 Pro Wake Control Bar	2022	\N	active	5	\N	\N	334.95	334.95	\N	{"size": "3", "color": ""}	2026-03-10 18:42:07.37599	RSE3WN	\N	\N	2022-04-26 00:00:00	\N
23	DK-DT-K-2024-001	kite	Duotone	Neo SLS 9m	2024	9	active	5	\N	\N	1499.00	1350.00	\N	{"size": "9", "color": "Blue/White"}	2026-03-17 22:38:48.839097	DT-NEO-SLS-9	\N	\N	\N	\N
24	DK-DT-K-2024-002	kite	Duotone	Neo SLS 12m	2024	9	active	5	\N	\N	1549.00	1400.00	\N	{"size": "12", "color": "Blue/White"}	2026-03-17 22:38:48.839097	DT-NEO-SLS-12	\N	\N	\N	\N
25	DK-DT-K-2024-003	kite	Duotone	Neo SLS 15m	2024	9	active	4	\N	\N	1599.00	1200.00	\N	{"size": "15", "color": "Orange/Black"}	2026-03-17 22:38:48.839097	DT-NEO-SLS-15	\N	\N	\N	\N
26	DK-DT-K-2023-004	kite	Duotone	Rebel SLS 7m	2023	9	active	4	\N	\N	1399.00	900.00	\N	{"size": "7", "color": "Red/Black"}	2026-03-17 22:38:48.839097	DT-RBL-SLS-7	\N	\N	\N	\N
27	DK-DT-K-2023-005	kite	Duotone	Rebel SLS 10m	2023	9	active	3	\N	\N	1449.00	750.00	\N	{"size": "10", "color": "Red/Black"}	2026-03-17 22:38:48.839097	DT-RBL-SLS-10	\N	\N	\N	\N
28	DK-CR-K-2024-006	kite	Core	XR8 13m	2024	9	active	5	\N	\N	1650.00	1480.00	\N	{"size": "13", "color": "Black/Lime"}	2026-03-17 22:38:48.839097	CR-XR8-13	\N	\N	\N	\N
29	DK-CR-K-2024-007	kite	Core	XR8 9m	2024	9	active	5	\N	\N	1550.00	1380.00	\N	{"size": "9", "color": "Black/Lime"}	2026-03-17 22:38:48.839097	CR-XR8-9	\N	\N	\N	\N
30	DK-CR-K-2022-008	kite	Core	XR7 11m	2022	9	active	2	\N	\N	1450.00	400.00	\N	{"size": "11", "color": "Yellow/Grey"}	2026-03-17 22:38:48.839097	CR-XR7-11	\N	\N	\N	\N
31	DK-NR-K-2024-009	kite	North	Reach 10m	2024	9	active	4	\N	\N	1550.00	1200.00	\N	{"size": "10", "color": "Mint/White"}	2026-03-17 22:38:48.839097	NR-REACH-10	\N	\N	\N	\N
32	DK-NR-K-2023-010	kite	North	Reach 8m	2023	9	active	3	\N	\N	1480.00	800.00	\N	{"size": "8", "color": "Mint/White"}	2026-03-17 22:38:48.839097	NR-REACH-8	\N	\N	\N	\N
33	DK-DT-B-2024-011	board	Duotone	Jaime SLS 136	2024	9	active	5	\N	\N	699.00	630.00	\N	{"size": "136"}	2026-03-17 22:38:48.839097	DT-JAIME-136	\N	\N	\N	\N
34	DK-DT-B-2023-012	board	Duotone	Select 140	2023	9	active	4	\N	\N	649.00	450.00	\N	{"size": "140"}	2026-03-17 22:38:48.839097	DT-SELECT-140	\N	\N	\N	\N
35	DK-CB-B-2024-013	board	Cabrinha	Stylus 138	2024	9	active	5	\N	\N	599.00	540.00	\N	{"size": "138"}	2026-03-17 22:38:48.839097	CB-STYLUS-138	\N	\N	\N	\N
36	DK-NR-B-2024-014	board	North	Atmos 142	2024	9	in_repair	2	\N	\N	799.00	300.00	\N	{"size": "142"}	2026-03-17 22:38:48.839097	NR-ATMOS-142	\N	\N	\N	\N
37	DK-CR-B-2023-015	board	Core	Fusion 5 133	2023	9	active	3	\N	\N	580.00	320.00	\N	{"size": "133"}	2026-03-17 22:38:48.839097	CR-FUSION5-133	\N	\N	\N	\N
38	DK-DT-BL-2024-016	bar_lines	Duotone	Trust Bar 20m	2024	9	active	5	\N	\N	549.00	490.00	\N	{"size": "20m"}	2026-03-17 22:38:48.839097	DT-TRUST-20M	\N	\N	\N	\N
39	DK-DT-BL-2024-017	bar_lines	Duotone	Trust Bar 24m	2024	9	active	4	\N	\N	549.00	450.00	\N	{"size": "24m"}	2026-03-17 22:38:48.839097	DT-TRUST-24M	\N	\N	\N	\N
40	DK-CR-BL-2023-018	bar_lines	Core	Sensor 3 Pro 22m	2023	9	active	4	\N	\N	489.00	350.00	\N	{"size": "22m"}	2026-03-17 22:38:48.839097	CR-SENS3-22M	\N	\N	\N	\N
41	DK-DT-FO-2024-019	foilboard	Duotone	Slick SLS 4m	2024	9	active	5	\N	\N	1099.00	990.00	\N	{"size": "4"}	2026-03-17 22:38:48.839097	DT-SLICK-SLS-4	\N	\N	\N	\N
42	DK-DT-FO-2024-020	foil	Duotone	Spirit GT Foil	2024	9	active	5	\N	\N	2200.00	2000.00	\N	{"size": "1100cm2"}	2026-03-17 22:38:48.839097	DT-SPIRIT-GT	\N	\N	\N	\N
43	TJ-DT-K-2024-021	kite	Duotone	Neo SLS 9m	2024	8	active	5	\N	\N	1499.00	1350.00	\N	{"size": "9", "color": "Green/Black"}	2026-03-17 22:38:48.839097	DT-NEO-SLS-9-TJ	\N	\N	\N	\N
44	TJ-DT-K-2024-022	kite	Duotone	Neo SLS 12m	2024	8	active	4	\N	\N	1549.00	1200.00	\N	{"size": "12", "color": "Green/Black"}	2026-03-17 22:38:48.839097	DT-NEO-SLS-12-TJ	\N	\N	\N	\N
45	TJ-DT-K-2023-023	kite	Duotone	Rebel SLS 10m	2023	8	active	4	\N	\N	1449.00	850.00	\N	{"size": "10", "color": "Blue/Silver"}	2026-03-17 22:38:48.839097	DT-RBL-SLS-10-TJ	\N	\N	\N	\N
46	TJ-NR-K-2024-024	kite	North	Reach 12m	2024	8	active	5	\N	\N	1580.00	1420.00	\N	{"size": "12", "color": "Mint/White"}	2026-03-17 22:38:48.839097	NR-REACH-12-TJ	\N	\N	\N	\N
47	TJ-CR-K-2023-025	kite	Core	Section 4 14m	2023	8	active	3	\N	\N	1599.00	800.00	\N	{"size": "14", "color": "White/Red"}	2026-03-17 22:38:48.839097	CR-SECT4-14-TJ	\N	\N	\N	\N
48	TJ-EL-K-2024-026	kite	Eleveight	OS 11m	2024	8	active	5	\N	\N	1350.00	1200.00	\N	{"size": "11", "color": "Blue/Orange"}	2026-03-17 22:38:48.839097	EL-OS-11-TJ	\N	\N	\N	\N
49	TJ-EL-K-2024-027	kite	Eleveight	OS 14m	2024	8	active	4	\N	\N	1399.00	1100.00	\N	{"size": "14", "color": "Blue/Orange"}	2026-03-17 22:38:48.839097	EL-OS-14-TJ	\N	\N	\N	\N
50	TJ-DT-B-2024-028	board	Duotone	Jaime SLS 134	2024	8	active	5	\N	\N	749.00	680.00	\N	{"size": "134"}	2026-03-17 22:38:48.839097	DT-JAIME-SLS-134-TJ	\N	\N	\N	\N
51	TJ-CB-B-2023-029	board	Cabrinha	Stylus 140	2023	8	active	3	\N	\N	599.00	330.00	\N	{"size": "140"}	2026-03-17 22:38:48.839097	CB-STYLUS-140-TJ	\N	\N	\N	\N
52	TJ-NR-B-2024-030	board	North	Atmos 136	2024	8	active	4	\N	\N	779.00	620.00	\N	{"size": "136"}	2026-03-17 22:38:48.839097	NR-ATMOS-136-TJ	\N	\N	\N	\N
53	TJ-DT-BL-2024-031	bar_lines	Duotone	Trust Bar 20m	2024	8	active	5	\N	\N	549.00	490.00	\N	{"size": "20m"}	2026-03-17 22:38:48.839097	DT-TRUST-20M-TJ	\N	\N	\N	\N
54	TJ-EL-BL-2023-032	bar_lines	Eleveight	Unity Bar 22m	2023	8	active	4	\N	\N	449.00	340.00	\N	{"size": "22m"}	2026-03-17 22:38:48.839097	EL-UNITY-22M-TJ	\N	\N	\N	\N
55	TJ-DT-W-2024-033	wing	Duotone	Slick SLS 4m	2024	8	active	5	\N	\N	1099.00	990.00	\N	{"size": "4"}	2026-03-17 22:38:48.839097	DT-SLICK-SLS-4-TJ	\N	\N	\N	\N
56	TJ-NR-W-2024-034	wing	North	Tensor 5m	2024	8	active	4	\N	\N	1050.00	890.00	\N	{"size": "5"}	2026-03-17 22:38:48.839097	NR-TENSOR-5-TJ	\N	\N	\N	\N
57	XFER-DT-K-2024-035	kite	Duotone	Neo SLS 7m	2024	9	in_transfer	4	\N	\N	1449.00	1100.00	\N	{"size": "7", "color": "Purple/White"}	2026-03-17 22:38:48.839097	DT-NEO-SLS-7-XFER	\N	\N	\N	\N
\.


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_log (id, user_id, action, equipment_id, details, "timestamp") FROM stdin;
1	1	user_login	\N	Admin logged in	2026-03-10 17:11:01.643632
2	1	user_login	\N	Admin logged in	2026-03-10 17:36:56.903903
3	1	user_login	\N	Admin logged in	2026-03-10 17:46:27.700376
4	1	user_login	\N	Admin logged in	2026-03-10 18:30:46.955643
5	1	user_login	\N	Admin logged in	2026-03-10 18:38:54.296055
6	1	user_login	\N	Admin logged in	2026-03-10 19:05:34.184859
7	1	user_login	\N	Admin logged in	2026-03-10 19:28:25.365158
8	1	user_login	\N	Admin logged in	2026-03-10 19:29:43.417735
9	1	user_login	\N	Admin logged in	2026-03-10 22:08:38.334628
10	1	user_login	\N	Admin logged in	2026-03-10 22:38:54.24017
11	1	user_login	\N	Admin logged in	2026-03-10 22:39:00.470088
12	1	user_login	\N	Admin logged in	2026-03-10 22:49:28.433313
13	1	user_login	\N	Admin logged in	2026-03-10 22:54:54.009802
14	1	user_login	\N	Admin logged in	2026-03-10 22:58:46.107448
15	1	user_login	\N	Admin logged in	2026-03-10 22:59:38.499697
16	1	user_login	\N	Admin logged in	2026-03-11 08:02:37.519586
17	1	user_login	\N	Admin logged in	2026-03-11 08:19:43.713198
18	1	user_login	\N	Admin logged in	2026-03-11 08:23:00.366002
19	1	user_login	\N	Admin logged in	2026-03-11 08:39:57.993899
20	1	user_login	\N	Admin logged in	2026-03-11 09:14:49.053955
21	1	user_login	\N	Admin logged in	2026-03-11 09:28:40.746534
22	1	user_login	\N	Admin logged in	2026-03-11 10:31:37.004072
23	1	user_login	\N	Admin logged in	2026-03-11 11:18:33.25996
24	1	user_login	\N	Admin logged in	2026-03-11 11:25:36.749278
25	1	user_login	\N	Admin logged in	2026-03-13 07:57:07.690941
26	1	feedback_updated	\N	Feedback #2 status → in_progress	2026-03-13 07:57:23.267192
27	1	user_login	\N	Admin logged in	2026-03-13 07:58:09.806189
28	1	user_login	\N	Admin logged in	2026-03-13 08:23:41.73755
29	1	feedback_submitted	\N	Feedback submitted from /test	2026-03-13 08:23:48.606729
30	1	feedback_updated	\N	Feedback #2 status → resolved	2026-03-13 08:23:48.711993
31	1	user_login	\N	Admin logged in	2026-03-13 08:24:21.0525
32	1	user_login	\N	Admin logged in	2026-03-13 08:36:18.649221
33	1	user_created	\N	Created user: testuser@example.com	2026-03-13 08:36:32.498116
34	1	user_login	\N	Admin logged in	2026-03-13 09:18:42.408801
35	1	user_login	\N	Admin logged in	2026-03-13 09:20:42.893524
36	1	user_created	\N	Created user: york@kiteworldwide.com	2026-03-13 09:21:06.723308
37	5	user_login	\N	Test User logged in	2026-03-13 09:21:06.814443
38	5	feedback_submitted	\N	Feedback submitted from /test	2026-03-13 09:21:06.875792
39	1	user_login	\N	Admin logged in	2026-03-13 09:31:06.301113
40	1	user_login	\N	Admin logged in	2026-03-13 09:46:25.254789
41	1	user_login	\N	Admin logged in	2026-03-13 09:46:58.273405
42	1	user_login	\N	Admin logged in	2026-03-13 09:48:18.096088
43	1	user_login	\N	Admin logged in	2026-03-13 11:00:37.670701
44	1	feedback_updated	\N	Feedback #3 status → resolved	2026-03-13 23:18:24.764501
45	1	user_login	\N	Admin logged in	2026-03-17 10:40:22.802958
46	1	user_login	\N	Admin logged in	2026-03-17 10:54:40.865761
47	1	user_login	\N	Admin logged in	2026-03-17 11:29:24.068108
48	1	user_login	\N	Admin logged in	2026-03-17 11:36:10.329968
49	1	user_login	\N	Admin logged in	2026-03-17 12:45:24.903201
50	1	user_login	\N	Admin logged in	2026-03-17 12:53:21.87861
51	1	user_login	\N	Admin logged in	2026-03-17 12:54:06.364072
52	1	user_login	\N	Admin logged in	2026-03-17 14:33:25.635967
53	1	equipment_csv_import	\N	CSV import: 3 imported, 0 skipped, 0 errors	2026-03-17 14:33:25.740765
54	1	equipment_csv_import	\N	CSV import: 0 imported, 3 skipped, 0 errors	2026-03-17 14:33:37.627206
55	1	user_login	\N	Admin logged in	2026-03-17 14:34:22.251466
56	1	user_login	\N	Admin logged in	2026-03-17 14:36:55.443814
57	1	equipment_csv_import	\N	CSV import: 6 imported, 0 skipped, 0 errors	2026-03-17 14:36:55.555728
58	1	equipment_csv_import	\N	CSV import: 2 imported, 1 skipped, 1 errors	2026-03-17 14:38:35.003635
59	1	user_login	\N	Admin logged in	2026-03-17 14:39:04.625427
60	1	equipment_csv_import	\N	CSV import: 3 imported, 0 skipped, 0 errors	2026-03-17 14:39:04.715145
61	1	user_login	\N	Admin logged in	2026-03-17 22:10:10.693741
62	1	user_login	\N	Admin logged in	2026-03-17 22:12:35.089989
63	1	user_login	\N	Admin logged in	2026-03-17 22:16:32.088848
64	1	inventory_check_started	\N	Started inventory check at Dakhla (0 items)	2026-03-17 22:17:01.253428
65	1	user_login	\N	Admin logged in	2026-03-17 22:22:36.173933
66	1	user_login	\N	Admin logged in	2026-03-17 22:28:52.718319
67	1	user_login	\N	Admin logged in	2026-03-17 22:34:33.461016
68	1	inventory_check_completed	\N	Completed inventory check at Dakhla	2026-03-17 23:13:41.792229
69	1	inventory_check_started	\N	Started inventory check at Dakhla (21 items)	2026-03-17 23:13:55.055867
70	1	user_login	\N	Admin logged in	2026-03-25 11:35:59.155648
71	1	user_login	\N	Admin logged in	2026-03-25 11:36:13.267084
72	1	user_login	\N	Admin logged in	2026-03-25 11:38:19.167924
73	1	user_login	\N	Admin logged in	2026-03-25 11:38:23.23132
105	1	user_login	\N	Admin logged in	2026-03-25 11:41:19.456404
106	1	user_login	\N	Admin logged in	2026-03-25 12:21:30.675953
107	1	user_login	\N	Admin logged in	2026-03-25 12:23:23.472
108	1	user_login	\N	Admin logged in	2026-03-25 12:56:20.71524
109	1	school_booking_created	\N	Booking SCH-DK-2026-001 created for John Test — MAD 950.00	2026-03-25 12:57:20.824907
110	1	school_booking_payment_updated	\N	Booking SCH-DK-2026-001 payment changed to credit_card	2026-03-25 12:57:57.71695
111	1	user_login	\N	Admin logged in	2026-03-25 13:04:50.962198
112	1	school_booking_created	\N	Booking SCH-DK-2026-002 created for Test Customer DateCheck — MAD 950.00	2026-03-25 13:06:04.719429
113	1	school_booking_created	\N	Booking SCH-DK-2026-003 created for Sophie Müller — MAD 8950.00	2026-03-25 13:19:16.285315
114	1	user_login	\N	Admin logged in	2026-03-25 13:33:05.824712
115	1	user_login	\N	Admin logged in	2026-03-25 13:35:49.419162
116	1	school_booking_created	\N	Booking SCH-DK-2026-004 created for Martin Pfalz — MAD 950.00	2026-03-25 13:54:33.804222
117	1	user_login	\N	Admin logged in	2026-03-25 14:01:48.187695
118	1	school_booking_payment_updated	\N	Booking SCH-DK-2026-003 payment changed to cash	2026-03-25 14:12:22.057198
119	1	school_booking_payment_updated	\N	Booking SCH-DK-2026-003 payment changed to credit_card	2026-03-25 14:12:23.393765
120	1	school_booking_payment_updated	\N	Booking SCH-DK-2026-004 payment changed to cash	2026-03-25 14:12:28.023153
121	1	user_login	\N	Admin logged in	2026-03-25 14:15:32.387989
122	1	user_login	\N	Admin logged in	2026-03-25 14:54:33.962691
123	1	user_login	\N	Admin logged in	2026-03-25 15:18:47.069947
124	1	user_login	\N	Admin logged in	2026-03-25 15:38:40.13306
125	1	user_login	\N	Admin logged in	2026-03-25 15:47:13.408147
126	1	user_login	\N	Admin logged in	2026-03-25 15:58:38.567943
127	1	user_login	\N	Admin logged in	2026-03-25 17:01:26.937669
128	1	user_login	\N	Admin logged in	2026-03-25 17:06:26.496497
129	1	user_login	\N	Admin logged in	2026-03-25 17:12:15.898749
130	1	user_login	\N	Admin logged in	2026-03-25 17:27:00.371374
131	1	user_login	\N	Admin logged in	2026-03-25 17:35:45.380802
132	1	user_login	\N	Admin logged in	2026-03-25 18:43:13.365978
133	1	user_login	\N	Admin logged in	2026-03-25 19:00:50.322406
134	1	user_login	\N	Admin logged in	2026-03-25 20:54:23.386768
135	1	user_login	\N	Admin logged in	2026-03-25 21:32:04.696742
136	1	user_login	\N	Admin logged in	2026-03-27 14:19:11.20286
137	1	user_login	\N	Admin logged in	2026-03-27 15:08:12.716802
138	1	user_login	\N	Admin logged in	2026-03-27 17:07:46.130185
139	1	user_login	\N	Admin logged in	2026-03-27 17:14:27.302925
140	1	user_login	\N	Admin logged in	2026-03-27 17:20:23.990467
141	1	user_login	\N	Admin logged in	2026-03-27 17:22:01.93129
142	1	user_login	\N	Admin logged in	2026-03-27 17:30:17.772632
143	1	user_login	\N	Admin logged in	2026-03-27 17:31:03.715347
175	1	user_login	\N	Admin logged in	2026-03-30 10:12:14.960063
176	1	user_login	\N	Admin logged in	2026-03-30 10:13:56.472597
177	1	user_login	\N	Admin logged in	2026-03-30 10:20:40.182938
178	1	user_login	\N	Admin logged in	2026-03-30 10:24:21.965309
179	1	user_login	\N	Admin logged in	2026-03-30 10:27:49.441998
180	1	user_login	\N	Admin logged in	2026-03-30 10:45:50.977246
181	1	user_login	\N	Admin logged in	2026-03-30 10:48:34.419506
182	1	user_login	\N	Admin logged in	2026-03-30 10:51:45.040809
183	1	user_login	\N	Admin logged in	2026-03-30 10:51:51.890845
184	1	user_login	\N	Admin logged in	2026-03-30 10:53:18.797693
185	1	user_login	\N	Admin logged in	2026-03-30 10:53:19.938742
186	1	user_login	\N	Admin logged in	2026-03-30 10:53:47.194299
187	1	user_login	\N	Admin logged in	2026-03-30 10:58:04.518613
188	1	user_login	\N	Admin logged in	2026-03-30 11:00:01.971258
189	1	user_login	\N	Admin logged in	2026-03-30 11:02:10.855832
190	1	user_login	\N	Admin logged in	2026-03-30 11:03:10.439875
222	1	user_login	\N	Admin logged in	2026-03-30 11:05:45.328161
223	6	user_login	\N	André Peschka logged in	2026-03-31 07:14:08.532937
224	1	user_login	\N	Admin logged in	2026-03-31 09:07:35.725834
\.


--
-- Data for Name: school_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.school_configs (id, station_id, school_name, currency, is_active, contact_email, created_at, destination_code_bos) FROM stdin;
1	9	KiteWorldWide Dakhla School	MAD	t	\N	2026-03-17 10:39:30.515739	MARDK01
\.


--
-- Data for Name: bos_import_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bos_import_logs (id, school_config_id, run_at, bos_ref, bos_version, record_type, status, skip_reason, customer_id, booking_id, customer_name, booking_number, raw_data, item_name, item_price) FROM stdin;
166	1	2026-03-31 09:48:08.895	119290	\N	customer	created	\N	230	\N	Björn Andersen	\N	{"bosNr": "119290", "email": "bjoernandersen100@gmail.com", "notes": [], "phone": "+491719231199", "lastName": "Andersen", "weightKg": null, "firstName": "Björn", "kiteLevel": "Beginner", "dateOfBirth": "1971-06-15", "earliestEnd": "2026-05-02", "nationality": "Germany", "earliestStart": "2026-04-18"}	\N	\N
167	1	2026-03-31 09:48:08.911	141995	1	booking	created	\N	230	128	Björn Andersen	141995-1	{"packages": [{"gesamt_ek": "777.00", "tnuntbng_akww": "141995", "tnuntbng_tnnr": "1", "tnuntbng_paket": "P2"}], "vog_akww": "141995", "ang_datum": "2025-12-21 19:49:31", "op_storno": "0", "bng_version": "1", "bng_reiseende": "2026-05-02", "bng_swuensche": "", "main_traveller": {"tnnr": "1", "kstm_ort": "Hamburg", "kstm_plz": "22297", "rtnb_ort": "", "rtnb_plz": "", "kstm_land": "Germany", "rtnb_land": "", "kstm_email": "bjoernandersen100@gmail.com", "kstm_mobil": "", "rtnb_email": "", "rtnb_mobil": "", "rtnb_gebdat": "15.6.1971", "kstm_hnummer": "1", "kstm_strasse": "Wolffsonweg", "rtnb_gewicht": "0", "rtnb_hnummer": "", "rtnb_strasse": "", "rtnb_vorname": "Björn", "kstm_festnetz": "+491719231199", "rtnb_nachname": "Andersen", "rtnb_kitelevel": "0", "kstm_kundennummer": "119290"}, "sub_travellers": [], "bng_reisebeginn": "2026-04-18", "op_storno_datum": "0000-00-00", "vog_kundennummer": "119290", "zusatzleistungen": []}	\N	\N
168	1	2026-03-31 09:48:08.911	141995	1	booking_item	created	\N	230	128	Björn Andersen	141995-1	{"category": "Package", "quantity": 1, "lineTotal": "777.00", "productId": 42, "unitPrice": "777.00", "productName": "Intermediate Package"}	Intermediate Package	777.00
10	1	2026-03-31 09:26:12.188	132747	\N	customer	unchanged	\N	177	\N	Sam Tom Christiaens	\N	{"bosNr": "132747", "email": "Sam.christiaens@telenet.be", "notes": [], "phone": "+32493726620", "lastName": "Christiaens", "weightKg": 87, "firstName": "Sam Tom", "kiteLevel": "Intermediate", "dateOfBirth": "1989-03-15", "earliestEnd": "2026-04-22", "nationality": "Belgium", "earliestStart": "2026-04-14"}	\N	\N
11	1	2026-03-31 09:26:12.392	103897	\N	customer	created	\N	180	\N	Thomas Haertel	\N	{"bosNr": "103897", "email": "tom_clark@gmx.de", "notes": [], "phone": "+4915111578769", "lastName": "Haertel", "weightKg": null, "firstName": "Thomas", "kiteLevel": "Beginner", "dateOfBirth": "1971-04-01", "earliestEnd": "2026-05-24", "nationality": "Germany", "earliestStart": "2026-05-15"}	\N	\N
12	1	2026-03-31 09:26:12.535	116506	\N	customer	created	\N	181	\N	Tobias Salomon	\N	{"bosNr": "116506", "email": "tobias.salomon@posteo.de", "notes": [], "phone": " +4917663233080", "lastName": "Salomon", "weightKg": null, "firstName": "Tobias", "kiteLevel": "Beginner", "dateOfBirth": "1990-04-30", "earliestEnd": "2026-05-30", "nationality": "Germany", "earliestStart": "2026-05-23"}	\N	\N
13	1	2026-03-31 09:26:12.651	116506-2	\N	customer	created	\N	182	\N	Magdalena Sidorowicz	\N	{"bosNr": "116506-2", "email": "magda.sid90@gmail.com", "notes": [], "phone": " +4917663233080", "lastName": "Sidorowicz", "weightKg": null, "firstName": "Magdalena", "kiteLevel": "Beginner", "dateOfBirth": "1990-06-03", "earliestEnd": "2026-05-30", "nationality": "Germany", "earliestStart": "2026-05-23"}	\N	\N
169	1	2026-03-31 15:53:18.576	113153	\N	customer	created	\N	231	\N	Felix Heinz Eckstein	\N	{"bosNr": "113153", "email": "eckstein@chondrometrics.de", "notes": [], "phone": "+491627316401", "lastName": "Eckstein", "weightKg": null, "firstName": "Felix Heinz", "kiteLevel": "Beginner", "dateOfBirth": "1964-06-20", "earliestEnd": "2026-05-20", "nationality": "Germany", "earliestStart": "2026-05-06"}	\N	\N
170	1	2026-03-31 15:53:18.732	141460	1	booking	created	\N	231	129	Felix Heinz Eckstein	141460-1	{"packages": [{"gesamt_ek": "126.00", "tnuntbng_akww": "141460", "tnuntbng_tnnr": "1", "tnuntbng_paket": "P0"}], "vog_akww": "141460", "ang_datum": "2025-12-22 20:06:48", "op_storno": "0", "bng_version": "1", "bng_reiseende": "2026-05-20", "bng_swuensche": "", "main_traveller": {"tnnr": "1", "kstm_ort": "Freilassing", "kstm_plz": "83395", "rtnb_ort": "", "rtnb_plz": "", "kstm_land": "Germany", "rtnb_land": "", "kstm_email": "eckstein@chondrometrics.de", "kstm_mobil": "+491627316401", "rtnb_email": "", "rtnb_mobil": "", "rtnb_gebdat": "20.6.1964", "kstm_hnummer": "12", "kstm_strasse": "Ludwig Zeller Str.", "rtnb_gewicht": "0", "rtnb_hnummer": "", "rtnb_strasse": "", "rtnb_vorname": "Felix Heinz", "kstm_festnetz": "+491627316401", "rtnb_nachname": "Eckstein", "rtnb_kitelevel": "0", "kstm_kundennummer": "113153"}, "sub_travellers": [], "bng_reisebeginn": "2026-05-06", "op_storno_datum": "0000-00-00", "vog_kundennummer": "113153", "zusatzleistungen": []}	\N	\N
171	1	2026-03-31 15:53:18.732	141460	1	booking_item	created	\N	231	129	Felix Heinz Eckstein	141460-1	{"category": "Package", "quantity": 1, "lineTotal": "126.00", "productId": 40, "unitPrice": "126.00", "productName": "Basic Package"}	Basic Package	126.00
61	1	2026-03-31 09:26:13.517	141421	2	booking	unchanged	\N	177	77	Sam Tom Christiaens	141421-1	{"packages": [{"gesamt_ek": "72.00", "tnuntbng_akww": "141421", "tnuntbng_tnnr": "1", "tnuntbng_paket": "P0"}], "vog_akww": "141421", "ang_datum": "2025-11-24 10:38:57", "op_storno": "0", "bng_version": "2", "bng_reiseende": "2026-04-22", "bng_swuensche": "", "main_traveller": {"tnnr": "1", "kstm_ort": "Vichte", "kstm_plz": "8570", "rtnb_ort": "", "rtnb_plz": "", "kstm_land": "Belgium", "rtnb_land": "", "kstm_email": "Sam.christiaens@telenet.be", "kstm_mobil": "", "rtnb_email": "", "rtnb_mobil": "", "rtnb_gebdat": "15.3.1989", "kstm_hnummer": "11", "kstm_strasse": "Molendreef", "rtnb_gewicht": "87", "rtnb_hnummer": "", "rtnb_strasse": "", "rtnb_vorname": "Sam Tom", "kstm_festnetz": "+32493726620", "rtnb_nachname": "Christiaens", "rtnb_kitelevel": "4", "kstm_kundennummer": "132747"}, "sub_travellers": [], "bng_reisebeginn": "2026-04-14", "op_storno_datum": "0000-00-00", "vog_kundennummer": "132747", "zusatzleistungen": []}	\N	\N
62	1	2026-03-31 09:26:13.528	141492	1	booking	created	\N	180	78	Thomas Haertel	141492-1	{"packages": [{"gesamt_ek": "394.00", "tnuntbng_akww": "141492", "tnuntbng_tnnr": "1", "tnuntbng_paket": "P4"}], "vog_akww": "141492", "ang_datum": "2025-12-01 15:37:59", "op_storno": "0", "bng_version": "1", "bng_reiseende": "2026-05-24", "bng_swuensche": "", "main_traveller": {"tnnr": "1", "kstm_ort": "Berlin", "kstm_plz": "13347", "rtnb_ort": "", "rtnb_plz": "", "kstm_land": "Germany", "rtnb_land": "", "kstm_email": "tom_clark@gmx.de", "kstm_mobil": "+4915111578769", "rtnb_email": "", "rtnb_mobil": "", "rtnb_gebdat": "1.4.1971", "kstm_hnummer": "18", "kstm_strasse": "Gerichtstr.", "rtnb_gewicht": "0", "rtnb_hnummer": "", "rtnb_strasse": "", "rtnb_vorname": "Thomas", "kstm_festnetz": "+4915111578769", "rtnb_nachname": "Haertel", "rtnb_kitelevel": "0", "kstm_kundennummer": "103897"}, "sub_travellers": [], "bng_reisebeginn": "2026-05-15", "op_storno_datum": "0000-00-00", "vog_kundennummer": "103897", "zusatzleistungen": []}	\N	\N
63	1	2026-03-31 09:26:13.528	141492	1	booking_item	created	\N	180	78	Thomas Haertel	141492-1	{"category": "Package", "quantity": 1, "lineTotal": "394.00", "productId": 44, "unitPrice": "394.00", "productName": "Rental Package"}	Rental Package	394.00
64	1	2026-03-31 09:26:13.555	141771	1	booking	created	\N	181	79	Tobias Salomon	141771-1	{"packages": [{"gesamt_ek": "310.00", "tnuntbng_akww": "141771", "tnuntbng_tnnr": "1", "tnuntbng_paket": "P4"}, {"gesamt_ek": "483.00", "tnuntbng_akww": "141771", "tnuntbng_tnnr": "2", "tnuntbng_paket": "P2"}], "vog_akww": "141771", "ang_datum": "2025-12-17 00:34:23", "op_storno": "0", "bng_version": "1", "bng_reiseende": "2026-05-30", "bng_swuensche": "", "main_traveller": {"tnnr": "1", "kstm_ort": "Dresden", "kstm_plz": "01159", "rtnb_ort": "", "rtnb_plz": "", "kstm_land": "Germany", "rtnb_land": "", "kstm_email": "tobias.salomon@posteo.de", "kstm_mobil": "017663233080", "rtnb_email": "", "rtnb_mobil": "", "rtnb_gebdat": "30.4.1990", "kstm_hnummer": "4", "kstm_strasse": "Fritz-Schulze-Str.", "rtnb_gewicht": "0", "rtnb_hnummer": "", "rtnb_strasse": "", "rtnb_vorname": "Tobias", "kstm_festnetz": " +4917663233080", "rtnb_nachname": "Salomon", "rtnb_kitelevel": "0", "kstm_kundennummer": "116506"}, "sub_travellers": [{"tnnr": "2", "rtnb_ort": "", "rtnb_plz": "", "rtnb_land": "Germany", "rtnb_email": "magda.sid90@gmail.com", "rtnb_mobil": "", "rtnb_gebdat": "3.6.1990", "rtnb_gewicht": "0", "rtnb_hnummer": "", "rtnb_strasse": "", "rtnb_vorname": "Magdalena", "rtnb_nachname": "Sidorowicz", "rtnb_kitelevel": "0"}], "bng_reisebeginn": "2026-05-23", "op_storno_datum": "0000-00-00", "vog_kundennummer": "116506", "zusatzleistungen": []}	\N	\N
65	1	2026-03-31 09:26:13.555	141771	1	booking_item	created	\N	181	79	Tobias Salomon	141771-1	{"category": "Package", "quantity": 1, "lineTotal": "310.00", "productId": 44, "unitPrice": "310.00", "productName": "Rental Package"}	Rental Package	310.00
66	1	2026-03-31 09:26:13.573	141771	1	booking	created	\N	182	80	Magdalena Sidorowicz	141771-2	{"packages": [{"gesamt_ek": "310.00", "tnuntbng_akww": "141771", "tnuntbng_tnnr": "1", "tnuntbng_paket": "P4"}, {"gesamt_ek": "483.00", "tnuntbng_akww": "141771", "tnuntbng_tnnr": "2", "tnuntbng_paket": "P2"}], "vog_akww": "141771", "ang_datum": "2025-12-17 00:34:23", "op_storno": "0", "bng_version": "1", "bng_reiseende": "2026-05-30", "bng_swuensche": "", "main_traveller": {"tnnr": "1", "kstm_ort": "Dresden", "kstm_plz": "01159", "rtnb_ort": "", "rtnb_plz": "", "kstm_land": "Germany", "rtnb_land": "", "kstm_email": "tobias.salomon@posteo.de", "kstm_mobil": "017663233080", "rtnb_email": "", "rtnb_mobil": "", "rtnb_gebdat": "30.4.1990", "kstm_hnummer": "4", "kstm_strasse": "Fritz-Schulze-Str.", "rtnb_gewicht": "0", "rtnb_hnummer": "", "rtnb_strasse": "", "rtnb_vorname": "Tobias", "kstm_festnetz": " +4917663233080", "rtnb_nachname": "Salomon", "rtnb_kitelevel": "0", "kstm_kundennummer": "116506"}, "sub_travellers": [{"tnnr": "2", "rtnb_ort": "", "rtnb_plz": "", "rtnb_land": "Germany", "rtnb_email": "magda.sid90@gmail.com", "rtnb_mobil": "", "rtnb_gebdat": "3.6.1990", "rtnb_gewicht": "0", "rtnb_hnummer": "", "rtnb_strasse": "", "rtnb_vorname": "Magdalena", "rtnb_nachname": "Sidorowicz", "rtnb_kitelevel": "0"}], "bng_reisebeginn": "2026-05-23", "op_storno_datum": "0000-00-00", "vog_kundennummer": "116506", "zusatzleistungen": []}	\N	\N
67	1	2026-03-31 09:26:13.573	141771	1	booking_item	created	\N	182	80	Magdalena Sidorowicz	141771-2	{"category": "Package", "quantity": 1, "lineTotal": "483.00", "productId": 42, "unitPrice": "483.00", "productName": "Intermediate Package"}	Intermediate Package	483.00
\.


--
-- Data for Name: cash_register_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cash_register_entries (id, school_config_id, date, opening_balance, notes, created_by, created_at) FROM stdin;
1	1	2026-03-01	0.00	\N	1	2026-03-25 20:48:10.854256
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (id, company_name, address, registry, tax_id, vat_id, managing_director, phone, website, bank_name, iban, bic, account_holder, logo_url, paypal_email, invoice_prefix, invoice_next_number, invoice_year) FROM stdin;
1	KiteWorldWide GmbH	Steindamm 97, D-20099 Hamburg	Amtsgericht Hamburg, HRB 105108	46/736/04728	DE259606444	York Neumann	+49 40 2093 45090	www.kiteworldwide.com	Commerzbank	DE69 2004 0000 0898 2100 00	COBADEFFXXX	KiteWorldWide GmbH	\N	\N	Inv-KWS	1004	2026
\.


--
-- Data for Name: condition_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.condition_ratings (id, equipment_id, rating, rated_by, rated_at, notes) FROM stdin;
1	30	3	1	2026-03-17 22:39:41.066891	Some wear on leading edge from use
2	30	2	1	2026-03-17 22:39:41.117839	Bladder has a slow leak, needs urgent repair
3	36	3	1	2026-03-17 22:39:41.120865	Rail impact, delamination starting
4	36	2	1	2026-03-17 22:39:41.124185	Delamination on port rail, sent for repair
5	27	3	1	2026-03-17 22:39:41.126905	Minor scratches, still usable
6	51	3	1	2026-03-17 22:39:41.129944	Base damage from shallow water landing
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, company_name, address, email, tax_id, created_at) FROM stdin;
1	Jane	\N	musterstr.1\nköln\ndeuschland	jane@jan	\N	2026-02-25 17:40:07.07834
2	Max Mustermann	\N	Teststraße 1\n12345 Berlin\nGermany	not-provided@kitetracker.com	\N	2026-02-25 23:46:45.120504
\.


--
-- Data for Name: repairs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repairs (id, equipment_id, description, cost, status, logged_by, date) FROM stdin;
1	30	Bladder replacement – 9m leading edge	85.00	pending	1	2026-03-10 22:39:05.953968
2	36	Port rail delamination repair	120.00	pending	1	2026-03-12 22:39:05.960668
3	27	Tip repair + reglassing	65.00	completed	1	2026-01-16 22:39:05.963444
\.


--
-- Data for Name: damage_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.damage_reports (id, equipment_id, reported_by, reported_at, how_it_happened, customer_name, booking_reference, usage_type, customer_insured, repairable, total_loss, can_repair_on_site, needs_spare_parts, spare_parts_needed, station_id, status, admin_notified, repair_id, estimated_repair_cost, estimated_value_loss) FROM stdin;
\.


--
-- Data for Name: damage_report_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.damage_report_photos (id, damage_report_id, url, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback (id, user_id, page_url, message, audio_url, screenshot_url, status, admin_notes, created_at, ticket_number) FROM stdin;
2	1	/	Die Equipment-Liste lädt zu langsam auf meinem iPhone	\N	\N	resolved	Wird untersucht	2026-03-04 07:57:02.584668	FB-0002
3	1	/test	Test email notification	\N	\N	resolved	\N	2026-03-13 08:23:48.598951	FB-0003
\.


--
-- Data for Name: feedback_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback_attachments (id, feedback_id, url, type, created_at) FROM stdin;
\.


--
-- Data for Name: feedback_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback_comments (id, feedback_id, user_id, message, created_at) FROM stdin;
1	2	1	Danke für das Feedback, schaue ich mir an!	2026-03-13 07:57:23.148132
2	2	1	Test-Kommentar vom Admin	2026-03-13 07:58:54.390051
3	2	1	Testing email on comment	2026-03-13 08:23:48.655969
4	3	1	E-Mail-Test Kommentar	2026-03-13 08:24:35.354701
5	2	1	Test-Kommentar für E-Mail-Versand	2026-03-13 09:20:42.963254
\.


--
-- Data for Name: inventory_checks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_checks (id, station_id, started_by, started_at, completed_at, status, total_items) FROM stdin;
1	9	1	2026-03-17 22:17:01.236395	2026-03-17 23:13:41.785	completed	0
2	9	1	2026-03-17 23:13:54.951311	\N	in_progress	21
\.


--
-- Data for Name: inventory_check_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_check_items (id, check_id, equipment_id, checked, condition_rating, needs_repair, missing, notes, checked_at, checked_by, photos) FROM stdin;
1	2	23	0	\N	0	0	\N	\N	\N	\N
2	2	24	0	\N	0	0	\N	\N	\N	\N
3	2	25	0	\N	0	0	\N	\N	\N	\N
4	2	26	0	\N	0	0	\N	\N	\N	\N
5	2	27	0	\N	0	0	\N	\N	\N	\N
6	2	28	0	\N	0	0	\N	\N	\N	\N
7	2	29	0	\N	0	0	\N	\N	\N	\N
8	2	30	0	\N	0	0	\N	\N	\N	\N
9	2	31	0	\N	0	0	\N	\N	\N	\N
10	2	32	0	\N	0	0	\N	\N	\N	\N
11	2	33	0	\N	0	0	\N	\N	\N	\N
12	2	34	0	\N	0	0	\N	\N	\N	\N
13	2	35	0	\N	0	0	\N	\N	\N	\N
14	2	36	0	\N	0	0	\N	\N	\N	\N
15	2	37	0	\N	0	0	\N	\N	\N	\N
16	2	38	0	\N	0	0	\N	\N	\N	\N
17	2	39	0	\N	0	0	\N	\N	\N	\N
18	2	40	0	\N	0	0	\N	\N	\N	\N
19	2	41	0	\N	0	0	\N	\N	\N	\N
20	2	42	0	\N	0	0	\N	\N	\N	\N
21	2	57	0	\N	0	0	\N	\N	\N	\N
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, name, color, created_at) FROM stdin;
1	Core	#f97316	2026-02-25 14:03:46.385846
2	North	#0ea5e9	2026-02-25 14:03:46.385846
3	Duotone	#8b5cf6	2026-02-25 14:03:46.385846
4	Eleveight	#10b981	2026-02-25 14:03:46.385846
5	Cabrinha	#ef4444	2026-03-11 07:48:18.752616
6	ION	#64748b	2026-03-11 07:48:20.159738
7	Mystic	#f59e0b	2026-03-11 07:48:20.840005
8	Manera	#ec4899	2026-03-11 07:48:20.845066
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, supplier_id, invoice_number, invoice_date, delivery_date, order_number, total_net, total_gross, imported_at, imported_by, item_count) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, link, read, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used_at) FROM stdin;
\.


--
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.photos (id, equipment_id, url, uploaded_by, uploaded_at, caption) FROM stdin;
\.


--
-- Data for Name: price_list_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_list_items (id, price_list_id, sku, product_name, retail_price, dealer_price, product_type) FROM stdin;
\.


--
-- Data for Name: sales_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_invoices (id, invoice_number, invoice_date, delivery_date, customer_id, payment_method, payment_terms, vat_type, vat_rate, vat_note, notes, total_net, total_vat, total_gross, status, created_at, created_by, damage_report_id, pdf_url, customer_type) FROM stdin;
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_items (id, sale_id, equipment_id, "position", description, serial_number, sku, quantity, unit_price, total) FROM stdin;
\.


--
-- Data for Name: school_customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.school_customers (id, school_config_id, first_name, last_name, email, phone, nationality, date_of_birth, kite_level, weight_kg, emergency_contact, arrival_date, departure_date, notes, created_at, created_by, guest_type, bos_customer_number) FROM stdin;
1	1	Sophie	Müller	sophie.mueller@gmail.com	+49 170 1234567	Germany	1992-05-15	Beginner	62	Hans Müller +49 170 9876543	2026-03-14	2026-03-21	First kite trip, very excited	2026-03-17 12:45:04.326832	\N	KiteWorldWide	\N
2	1	Jean-Pierre	Dubois	jp.dubois@outlook.fr	+33 6 12345678	France	1988-11-20	Intermediate	78	Marie Dubois +33 6 87654321	2026-03-15	2026-03-22	\N	2026-03-17 12:45:04.326832	\N	KiteWorldWide	\N
3	1	Carlos	Rodriguez	carlos.r@yahoo.es	+34 612 345 678	Spain	1995-03-08	Advanced	82	Ana Rodriguez +34 612 876 543	2026-03-16	2026-03-18	Wants to try foiling	2026-03-17 12:45:04.326832	\N	Walk-in	\N
4	1	Emma	Thompson	emma.t@icloud.com	+44 7700 123456	United Kingdom	1990-08-25	Pro	65	James Thompson +44 7700 654321	2026-03-10	2026-03-24	Competition rider, bringing own gear	2026-03-17 12:45:04.326832	\N	Walk-in	\N
7	1	Sarah	Miller	sarah.miller@demo.com	+49170111001	German	1995-06-15	Beginner	75	Emergency: +49170999999	2026-03-23	2026-03-30	\N	2026-03-25 15:51:20.679239	\N	Walk-in	\N
8	1	Tom	Weber	tom.weber@demo.com	+49170111002	German	1990-03-22	Beginner	75	Emergency: +49170999999	2026-03-24	2026-03-31	\N	2026-03-25 15:51:20.714616	\N	Walk-in	\N
9	1	Lisa	Schmidt	lisa.schmidt@demo.com	+49170111003	Austrian	1988-11-08	Intermediate	75	Emergency: +49170999999	2026-03-25	2026-04-01	\N	2026-03-25 15:51:20.717156	\N	Walk-in	\N
10	1	Max	Fischer	max.fischer@demo.com	+49170111004	German	1992-07-30	Advanced	75	Emergency: +49170999999	2026-03-25	2026-03-29	\N	2026-03-25 15:51:20.720907	\N	Walk-in	\N
11	1	Julia	Braun	julia.braun@demo.com	+49170111005	Swiss	1997-01-12	Beginner	75	Emergency: +49170999999	2026-03-26	2026-04-02	\N	2026-03-25 15:51:20.724144	\N	Walk-in	\N
12	1	David	Koch	david.koch@demo.com	+49170111006	German	1985-09-25	Intermediate	75	Emergency: +49170999999	2026-03-27	2026-04-03	\N	2026-03-25 15:51:20.727303	\N	Walk-in	\N
13	1	Anna	Hoffmann	anna.hoffmann@demo.com	+49170111007	German	1993-04-18	Beginner	75	Emergency: +49170999999	2026-03-22	2026-03-29	\N	2026-03-25 15:51:20.738767	\N	Walk-in	\N
14	1	Felix	Richter	felix.richter@demo.com	+49170111008	Dutch	1991-12-03	Advanced	75	Emergency: +49170999999	2026-03-25	2026-04-04	\N	2026-03-25 15:51:20.741716	\N	Walk-in	\N
15	1	Emma	Wolf	emma.wolf@demo.com	+49170111009	French	1996-08-20	Beginner	75	Emergency: +49170999999	2026-03-28	2026-04-04	\N	2026-03-25 15:51:20.745017	\N	Walk-in	\N
16	1	Luca	Becker	luca.becker@demo.com	+491701110010	Italian	1994-02-14	Intermediate	75	Emergency: +49170999999	2026-03-24	2026-03-28	\N	2026-03-25 15:51:20.748353	\N	Walk-in	\N
177	1	Sam Tom	Christiaens	Sam.christiaens@telenet.be	+32493726620	Belgium	1989-03-15	Intermediate	87		2026-04-14	2026-04-22	\N	2026-03-30 15:57:10.152298	\N	KiteWorldWide	132747
180	1	Thomas	Haertel	tom_clark@gmx.de	+4915111578769	Germany	1971-04-01	Beginner	\N		2026-05-15	2026-05-24	\N	2026-03-31 09:26:12.393817	\N	KiteWorldWide	103897
181	1	Tobias	Salomon	tobias.salomon@posteo.de	 +4917663233080	Germany	1990-04-30	Beginner	\N		2026-05-23	2026-05-30	\N	2026-03-31 09:26:12.536419	\N	KiteWorldWide	116506
182	1	Magdalena	Sidorowicz	magda.sid90@gmail.com	 +4917663233080	Germany	1990-06-03	Beginner	\N		2026-05-23	2026-05-30	\N	2026-03-31 09:26:12.652994	\N	KiteWorldWide	116506-2
230	1	Björn	Andersen	bjoernandersen100@gmail.com	+491719231199	Germany	1971-06-15	Beginner	\N		2026-04-18	2026-05-02	\N	2026-03-31 09:48:08.896829	\N	KiteWorldWide	119290
231	1	Felix Heinz	Eckstein	eckstein@chondrometrics.de	+491627316401	Germany	1964-06-20	Beginner	\N		2026-05-06	2026-05-20	\N	2026-03-31 15:53:18.577707	\N	KiteWorldWide	113153
\.


--
-- Data for Name: school_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.school_bookings (id, school_config_id, booking_number, customer_id, customer_name, customer_email, payment_status, total_amount, currency, notes, created_at, created_by, booking_date, email_sent_at, pdf_url, booking_version_bos) FROM stdin;
1	1	SCH-DK-2026-001	\N	John Test	john@test.com	credit_card	950.00	MAD	\N	2026-03-25 12:57:20.816474	1		\N	\N	\N
2	1	SCH-DK-2026-002	\N	Test Customer DateCheck	\N	unpaid	950.00	MAD	\N	2026-03-25 13:06:04.711804	1	2026-03-20	\N	\N	\N
3	1	SCH-DK-2026-003	\N	Sophie Müller	sophie.mueller@gmail.com	credit_card	8950.00	MAD	\N	2026-03-25 13:19:16.27081	1	2026-03-25	\N	\N	\N
4	1	SCH-DK-2026-004	\N	Martin Pfalz	\N	cash	950.00	MAD	\N	2026-03-25 13:54:33.789387	1	2026-03-25	\N	\N	\N
5	1	SCH-DK-2026-901	\N	Sarah Miller	\N	cash	450.00	EUR	\N	2026-03-25 15:52:13.586086	\N	2026-03-23	\N	\N	\N
6	1	SCH-DK-2026-902	\N	Tom Weber	\N	credit_card	730.00	EUR	\N	2026-03-25 15:52:13.599043	\N	2026-03-24	\N	\N	\N
7	1	SCH-DK-2026-903	\N	Lisa Schmidt	\N	unpaid	350.00	EUR	\N	2026-03-25 15:52:13.608486	\N	2026-03-25	\N	\N	\N
8	1	SCH-DK-2026-904	\N	Max Fischer	\N	cash	200.00	EUR	\N	2026-03-25 15:52:13.61479	\N	2026-03-25	\N	\N	\N
9	1	SCH-DK-2026-905	\N	Julia Braun	\N	unpaid	450.00	EUR	\N	2026-03-25 15:52:13.621276	\N	2026-03-26	\N	\N	\N
10	1	SCH-DK-2026-906	\N	David Koch	\N	unpaid	120.00	EUR	\N	2026-03-25 15:52:13.62791	\N	2026-03-27	\N	\N	\N
11	1	SCH-DK-2026-907	\N	Anna Hoffmann	\N	cash	450.00	EUR	\N	2026-03-25 15:52:13.633621	\N	2026-03-22	\N	\N	\N
12	1	SCH-DK-2026-908	\N	Emma Wolf	\N	unpaid	450.00	EUR	\N	2026-03-25 15:52:13.639593	\N	2026-03-28	\N	\N	\N
13	1	SCH-DK-2026-909	\N	Luca Becker	\N	credit_card	120.00	EUR	\N	2026-03-25 15:52:13.645126	\N	2026-03-24	\N	\N	\N
77	1	141421-1	177	Sam Tom Christiaens	Sam.christiaens@telenet.be	paid-kww	72.00	EUR	\N	2026-03-30 15:57:19.95841	\N	2026-04-14	\N	\N	2
78	1	141492-1	180	Thomas Haertel	tom_clark@gmx.de	paid-kww	394.00	EUR	\N	2026-03-31 09:26:13.529272	\N	2026-05-15	\N	\N	1
79	1	141771-1	181	Tobias Salomon	tobias.salomon@posteo.de	paid-kww	310.00	EUR	\N	2026-03-31 09:26:13.556325	\N	2026-05-23	\N	\N	1
80	1	141771-2	182	Magdalena Sidorowicz	magda.sid90@gmail.com	paid-kww	483.00	EUR	\N	2026-03-31 09:26:13.574283	\N	2026-05-23	\N	\N	1
128	1	141995-1	230	Björn Andersen	bjoernandersen100@gmail.com	paid-kww	777.00	EUR	\N	2026-03-31 09:48:08.91248	\N	2026-04-18	\N	\N	1
129	1	141460-1	231	Felix Heinz Eckstein	eckstein@chondrometrics.de	paid-kww	126.00	EUR	\N	2026-03-31 15:53:18.733146	\N	2026-05-06	2026-03-31 15:54:29.548515	\N	1
\.


--
-- Data for Name: school_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.school_products (id, school_config_id, name, description, category, default_price, is_active, sort_order, created_at, source, bos_code) FROM stdin;
11	1	Private Lesson – 1 Hour	\N	Lesson	950.00	t	1	2026-03-25 12:15:52.568862	walkin	\N
12	1	Private Lesson – 2 Hours	\N	Lesson	1800.00	t	2	2026-03-25 12:15:56.520255	walkin	\N
13	1	Private Lesson – 4 Hours	\N	Lesson	3400.00	t	3	2026-03-25 12:16:00.335694	walkin	\N
14	1	Private Lesson – Additional Hour	\N	Lesson	750.00	t	4	2026-03-25 12:16:04.148025	walkin	\N
15	1	Lesson Add-on – 1 Hour	\N	Lesson	850.00	t	5	2026-03-25 12:16:08.174148	walkin	\N
16	1	Lesson Add-on – 2 Hours	\N	Lesson	1600.00	t	6	2026-03-25 12:16:11.942292	walkin	\N
17	1	Lesson Add-on – 4 Hours	\N	Lesson	3050.00	t	7	2026-03-25 12:16:15.80589	walkin	\N
18	1	Lesson Add-on – Additional Hour	\N	Lesson	700.00	t	8	2026-03-25 12:16:19.722512	walkin	\N
19	1	Beginner Course Private – 9 Hours	\N	Course	7150.00	t	9	2026-03-25 12:16:23.507339	walkin	\N
20	1	Beginner Course Private – 12 Hours	\N	Course	8200.00	t	10	2026-03-25 12:16:27.411711	walkin	\N
21	1	Beginner Course Semi-Private – 9 Hours	\N	Course	6000.00	t	11	2026-03-25 12:16:31.219748	walkin	\N
22	1	Beginner Course Semi-Private – 12 Hours	\N	Course	6850.00	t	12	2026-03-25 12:16:34.932308	walkin	\N
23	1	Rental per Person – 2 Hours	\N	Rental	750.00	t	13	2026-03-25 12:16:38.68959	walkin	\N
24	1	Rental per Person – 1 Day	\N	Rental	1000.00	t	14	2026-03-25 12:16:42.497235	walkin	\N
25	1	Rental per Person – 1 Week	\N	Rental	4100.00	t	15	2026-03-25 12:16:46.412217	walkin	\N
26	1	Rental per Person – Additional Day	\N	Rental	650.00	t	16	2026-03-25 12:16:50.35285	walkin	\N
27	1	Rental Board Only – 2 Hours	\N	Rental	400.00	t	17	2026-03-25 12:16:54.270875	walkin	\N
28	1	Rental Board Only – 1 Day	\N	Rental	550.00	t	18	2026-03-25 12:16:58.245023	walkin	\N
29	1	Rental Board Only – 1 Week	\N	Rental	2050.00	t	19	2026-03-25 12:17:02.041647	walkin	\N
30	1	Rental Board Only – Additional Day	\N	Rental	350.00	t	20	2026-03-25 12:17:05.889641	walkin	\N
31	1	Rental Kite & Bar – 2 Hours	\N	Rental	550.00	t	21	2026-03-25 12:17:09.860323	walkin	\N
32	1	Rental Kite & Bar – 1 Day	\N	Rental	750.00	t	22	2026-03-25 12:17:13.744593	walkin	\N
33	1	Rental Kite & Bar – 1 Week	\N	Rental	2850.00	t	23	2026-03-25 12:17:17.724796	walkin	\N
34	1	Rental Kite & Bar – Additional Day	\N	Rental	450.00	t	24	2026-03-25 12:17:21.650154	walkin	\N
35	1	Kite Service – 1 Day	\N	Other	200.00	t	25	2026-03-25 12:17:25.482783	walkin	\N
36	1	Kite Service – 1 Week	\N	Other	950.00	t	26	2026-03-25 12:17:29.327815	walkin	\N
37	1	Kite Service – Additional Day	\N	Other	150.00	t	27	2026-03-25 12:17:33.171395	walkin	\N
38	1	VDWS Licence	\N	Other	500.00	t	28	2026-03-25 12:17:37.163365	walkin	\N
39	1	Licence Upgrade	\N	Other	300.00	t	29	2026-03-25 12:17:41.033201	walkin	\N
40	1	Basic Package	\N	Package	0.00	t	0	2026-03-27 15:08:17.224883	kiteworldwide	P0
41	1	Beginner Package	\N	Package	0.00	t	0	2026-03-27 15:08:17.224883	kiteworldwide	P1
42	1	Intermediate Package	\N	Package	0.00	t	0	2026-03-27 15:08:17.224883	kiteworldwide	P2
43	1	Advanced Package	\N	Package	0.00	t	0	2026-03-27 15:08:17.224883	kiteworldwide	P3
44	1	Rental Package	\N	Package	0.00	t	0	2026-03-27 15:08:17.224883	kiteworldwide	P4
45	1	Non-Kite Package	\N	Package	0.00	t	0	2026-03-27 15:08:17.224883	kiteworldwide	A0
46	1	Wingfoil Beginner Package	\N	Package	0.00	t	0	2026-03-27 15:08:17.224883	kiteworldwide	P9
47	1	Private Lessons - 2h (excl. equipment)	\N	Lesson	0.00	t	0	2026-03-27 15:21:26.416927	kiteworldwide	MDKKIK01
48	1	Wingfoil beginner course: 5 hours including material	\N	Lesson	0.00	t	0	2026-03-27 15:21:26.416927	kiteworldwide	MDWKIK01
49	1	Private Wingfoil lesson after the course - 1h	\N	Lesson	0.00	t	0	2026-03-27 15:21:26.416927	kiteworldwide	MDWKIK02
50	1	Private Lesson - 1h (excl. equipment)	\N	Lesson	0.00	t	0	2026-03-27 15:21:26.416927	kiteworldwide	MDKKPK02
\.


--
-- Data for Name: school_booking_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.school_booking_items (id, booking_id, product_id, product_name, category, quantity, unit_price, line_total) FROM stdin;
1	1	11	Private Lesson – 1 Hour	Lesson	1	950.00	950.00
2	2	11	Private Lesson – 1 Hour	Lesson	1	950.00	950.00
3	3	19	Beginner Course Private – 9 Hours	Course	1	7150.00	7150.00
4	3	12	Private Lesson – 2 Hours	Lesson	1	1800.00	1800.00
5	4	11	Private Lesson – 1 Hour	Lesson	1	950.00	950.00
6	5	\N	Beginner Course – 5 Days	Course	1	450.00	450.00
7	6	\N	Beginner Course – 5 Days	Course	1	450.00	450.00
8	6	\N	Equipment Rental – 7 Days	Rental	1	280.00	280.00
9	7	\N	Intermediate Course – 3 Days	Course	1	350.00	350.00
10	8	\N	Equipment Rental – 5 Days	Rental	1	200.00	200.00
11	9	\N	Beginner Course – 5 Days	Course	1	450.00	450.00
12	10	\N	Equipment Rental – 3 Days	Rental	1	120.00	120.00
13	11	\N	Beginner Course – 5 Days	Course	1	450.00	450.00
14	12	\N	Beginner Course – 5 Days	Course	1	450.00	450.00
15	13	\N	Equipment Rental – 3 Days	Rental	1	120.00	120.00
83	77	40	Basic Package	Package	1	72.00	72.00
84	78	44	Rental Package	Package	1	394.00	394.00
85	79	44	Rental Package	Package	1	310.00	310.00
86	80	42	Intermediate Package	Package	1	483.00	483.00
138	128	42	Intermediate Package	Package	1	777.00	777.00
139	129	40	Basic Package	Package	1	126.00	126.00
\.


--
-- Data for Name: school_customer_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.school_customer_documents (id, customer_id, category, object_key, file_name, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- Data for Name: school_expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.school_expenses (id, school_config_id, amount, currency, category, description, expense_date, receipt_url, created_by, created_at) FROM stdin;
1	1	150.00	MAD	fuel_gas	Gas for boat	2026-03-25	\N	1	2026-03-25 19:02:05.840418
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
-RWxXG2yH6VKanp84YaorcRWtRNaGdkC	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T20:54:23.390Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 20:55:31
URPUFcvFpXlssFved69CwqOn9klBqaM5	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T11:03:10.443Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 11:03:11
PyX8DXwAd2zopYvytsBWo12mdUKFYFwM	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T15:38:40.140Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 15:39:11
NuS09NRtuUyk18ibObh9IsG0tWm1D3AK	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:51:51.893Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:51:52
aB3RTAAAe-iexJRIMPinHqVzU99FG4bb	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T18:43:13.370Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 18:44:21
4AoZsBKE_J-__jU4aFyjeAXlT1weku9N	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T21:32:04.700Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 21:32:35
2i4IuhYBA3qSywJPrRiYVKRyzP3b-0JU	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T17:01:26.941Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 17:02:54
2CLz_1kvhwcRNRewcvlsXUdq9FnrVPuq	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T14:54:33.970Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 14:55:05
rJjt3QM6PiKlkccVG2eHIGOdK25KSOt7	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T14:15:32.391Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 14:16:00
2MXVs-0LBFE8DZgjrBPXiegzTjtoIWhX	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T17:12:15.902Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 17:15:25
jjqxcqV7vRHi26mBIkmoIyXC7zBOy221	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T17:27:00.375Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 17:28:33
SziTPnc823kodDwiHAGh-2HL8qJMKI03	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T17:35:45.406Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 17:37:37
FH6iaP4aKkOUM3qrFIpFa-3F_Qu-HEry	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T19:00:50.326Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 19:02:51
OR_NB_kkZSauMRWlMx24ZghA5iQEa9lm	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:51:45.052Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:51:46
Mythis5y4bmSKKM2rZdeAG_N9iUBhCbB	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:20:40.185Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:21:20
LTcLvbufh3JB-1Y2vlYMkTDkHvbQZQrU	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:27:49.445Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:28:36
mqGVColAqjXBbED-rRs_yPJMQQtAa0lL	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:58:04.523Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:58:35
kZsJyWRujlV2L-qojBP9G3rybWOk8En0	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T11:35:59.171Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2026-04-24 11:36:00
zxG_uSprD4VGapwzQfqWAsDj-v9EoU_n	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T11:38:19.179Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 11:38:20
zh2rBejMndd2Feo6cIqlkhYk09tlaSw_	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T11:38:23.234Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 11:38:24
j92Wq10iSIAPlzHQdTTW_l4iM-kRYbFU	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:12:14.967Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:12:52
XCaYfXMVtXCjhq14e_nfzZSfunyFW8t9	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-30T09:07:35.733Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-30 09:07:36
eCoW3Sr6BRwRBjoXIdTm-_a8vghbPCTB	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T11:36:13.270Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2026-04-24 11:36:14
kCJ0klm_aLBpbKUIT_H-b63WMiydGOc4	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T11:00:01.974Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 11:00:02
OebLrJX4nFtPOvydWIdZs6cMELraO5qF	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T12:21:30.679Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 12:21:57
wy3o6hRzefsLjhLmBFfEkTK1phYtDxF6	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T12:23:23.476Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 12:23:56
FlpKKsZFwPSnRwQt-kcVhU5FxtkVMlUR	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-26T17:31:03.718Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-26 17:31:05
qI3EdShooXbPv44c0nTuCZ8yYKe79uom	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T15:58:38.575Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 16:00:15
VCqT8f2WZNpP-s17VtsrlrwA9Wjeb9yW	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-26T14:19:11.297Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-26 14:20:05
n88M9eT_66GnrCFsV4hQN-lSdwT4hLd5	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T17:06:26.499Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 17:09:39
cjiB2Rx1RfXlcsouPVmv2HSIawQ105Nu	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:24:21.969Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:25:00
JXfDiDqyaRJD5xKKS36ELTcwAx4F2gNN	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T13:35:49.423Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 13:36:27
HSrg260C7b_boWjMOx7lqRyt0vZSNDtu	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T14:01:48.191Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 14:03:28
9WxGpHmt-u6M_IIWAPXrRKAzg2ADndlA	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-26T17:07:46.134Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-26 17:08:12
EJ4SHTi3rWjbcF6Vl-Tcx41LgHwZ2-LJ	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:53:18.801Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:53:19
rU3Gn0rL-VfJYh3fwYChKLs9sd3DhMh0	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:53:19.941Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:53:20
VAVxN5y3XEjO9LtAtsssC40jz9ZSxGJN	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-26T17:22:01.935Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-26 17:22:35
rQw3pft93MawUsWHSIg4mJVeUjAX5ujl	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T11:05:45.337Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 11:05:46
hi84XZVqYxR8mDknFoyf4ro_HQUUR4N-	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T13:04:50.965Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 13:06:40
_E6F7tJVmDcIphDTxH0A2_CP9sw1is0V	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:13:56.476Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:14:27
CNCijm0H_xn3pLkHvUmvgLBUMXjXVNpK	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T12:56:20.722Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 12:58:07
6nhP2PHnBh99BYFKo9_xfKefZ_Q3yFYc	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:48:34.422Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 12:18:35
DgOCj4r3-FDbx9Kb1aFhYqjbrxi2PVM1	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:45:50.988Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 11:03:49
kDZKEdiWhyA-RLafCe3by6deBtL0XaG2	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T13:33:05.827Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 13:33:49
ZrtBFTZ_GsE3gvEhp_wHYANiPX3EVYF1	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T15:47:13.411Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 15:48:09
gKO3wNsWK5kf7-f0MUs6xGNVOOOm3xC8	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-26T15:08:12.720Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-26 16:46:50
Omqmue3Gy2HEBlkMdUVlJMXfhGHxY860	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-26T17:14:27.314Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-26 17:14:34
m_hSlOXKoJCFZunP1ch-E7_lIWQNFKRo	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T15:18:47.073Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-24 15:20:19
CdSa1yBYiwJPubE1gEaLfCSAqjzuA29V	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-26T17:20:24.216Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-26 17:20:25
5buoxBv86CDa1TFNrw_S9wJQvXJSneds	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-26T17:30:17.777Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-26 17:30:20
53q_zjgphq37VrHBYD5Z59ZBwl9dqGps	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T10:53:47.197Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 10:54:33
vAAPvc2dA1fC9UGh_XAajEufxycWu9A_	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-30T07:14:08.537Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":6}}	2026-05-20 16:31:48
5wTJEj2HvGdxXRT8PpsZjDDH_abfn0mz	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-24T11:41:19.462Z","secure":false,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-25 15:13:14
yLgCguTGcHHANzBi1L3CVNG0MbaQJiuR	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-16T22:16:32.103Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":1}}	2026-04-30 15:57:22
1nhbJ_Q_XKfNu-VZjLX4C67U7q0zWJwu	{"cookie":{"originalMaxAge":2592000000,"expires":"2026-04-29T11:02:10.859Z","secure":true,"httpOnly":true,"path":"/","sameSite":"none"},"passport":{"user":1}}	2026-04-29 11:02:27
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transfers (id, equipment_id, from_station_id, to_station_id, initiated_by, confirmed_by, initiated_at, confirmed_at, status, arrived_condition, missing) FROM stdin;
1	57	9	8	1	\N	2026-03-15 22:39:05.966793	\N	pending	\N	f
\.


--
-- Name: accessory_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accessory_categories_id_seq', 6, true);


--
-- Name: accessory_check_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accessory_check_items_id_seq', 1, false);


--
-- Name: accessory_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accessory_checks_id_seq', 1, false);


--
-- Name: accessory_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accessory_inventory_id_seq', 30, true);


--
-- Name: accessory_loss_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accessory_loss_reports_id_seq', 1, false);


--
-- Name: accessory_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accessory_transfers_id_seq', 1, false);


--
-- Name: activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_log_id_seq', 224, true);


--
-- Name: bos_import_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bos_import_logs_id_seq', 171, true);


--
-- Name: cash_register_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cash_register_entries_id_seq', 1, true);


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 1, false);


--
-- Name: condition_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.condition_ratings_id_seq', 6, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 2, true);


--
-- Name: damage_report_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.damage_report_photos_id_seq', 1, false);


--
-- Name: damage_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.damage_reports_id_seq', 1, false);


--
-- Name: equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_id_seq', 57, true);


--
-- Name: feedback_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feedback_attachments_id_seq', 1, false);


--
-- Name: feedback_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feedback_comments_id_seq', 5, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feedback_id_seq', 4, true);


--
-- Name: inventory_check_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_check_items_id_seq', 21, true);


--
-- Name: inventory_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_checks_id_seq', 2, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 2, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.photos_id_seq', 1, false);


--
-- Name: price_list_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.price_list_items_id_seq', 1, false);


--
-- Name: price_lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.price_lists_id_seq', 1, false);


--
-- Name: repairs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.repairs_id_seq', 3, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 1, false);


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_invoices_id_seq', 1, false);


--
-- Name: school_booking_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.school_booking_items_id_seq', 139, true);


--
-- Name: school_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.school_bookings_id_seq', 129, true);


--
-- Name: school_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.school_configs_id_seq', 2, true);


--
-- Name: school_customer_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.school_customer_documents_id_seq', 1, true);


--
-- Name: school_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.school_customers_id_seq', 231, true);


--
-- Name: school_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.school_expenses_id_seq', 1, true);


--
-- Name: school_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.school_products_id_seq', 50, true);


--
-- Name: stations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stations_id_seq', 11, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 8, true);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transfers_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- PostgreSQL database dump complete
--

\unrestrict UuG6It59fJwnR0KPQmaH3j1X34zHNHJP9s1QHEDJQFflLISedPstF55LH5Xp8G9

