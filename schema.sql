cks_started_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_started_by_users_id_fk FOREIGN KEY (started_by) REFERENCES public.users(id);


--
-- Name: inventory_checks inventory_checks_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_checks
    ADD CONSTRAINT inventory_checks_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: invoices invoices_imported_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_imported_by_users_id_fk FOREIGN KEY (imported_by) REFERENCES public.users(id);


--
-- Name: invoices invoices_supplier_id_suppliers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_supplier_id_suppliers_id_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: photos photos_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: photos photos_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: price_list_items price_list_items_price_list_id_price_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_price_list_id_price_lists_id_fk FOREIGN KEY (price_list_id) REFERENCES public.price_lists(id) ON DELETE CASCADE;


--
-- Name: price_lists price_lists_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: repairs repairs_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: repairs repairs_logged_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repairs
    ADD CONSTRAINT repairs_logged_by_users_id_fk FOREIGN KEY (logged_by) REFERENCES public.users(id);


--
-- Name: sale_items sale_items_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: sale_items sale_items_sale_id_sales_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_sales_invoices_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales_invoices(id);


--
-- Name: sales_invoices sales_invoices_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: sales_invoices sales_invoices_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales_invoices sales_invoices_damage_report_id_damage_reports_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_damage_report_id_damage_reports_id_fk FOREIGN KEY (damage_report_id) REFERENCES public.damage_reports(id);


--
-- Name: school_booking_items school_booking_items_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_booking_items
    ADD CONSTRAINT school_booking_items_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.school_bookings(id);


--
-- Name: school_booking_items school_booking_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_booking_items
    ADD CONSTRAINT school_booking_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.school_products(id);


--
-- Name: school_bookings school_bookings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: school_bookings school_bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.school_customers(id);


--
-- Name: school_bookings school_bookings_school_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_bookings
    ADD CONSTRAINT school_bookings_school_config_id_fkey FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: school_configs school_configs_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_station_id_stations_id_fk FOREIGN KEY (station_id) REFERENCES public.stations(id);


--
-- Name: school_customer_documents school_customer_documents_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customer_documents
    ADD CONSTRAINT school_customer_documents_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.school_customers(id) ON DELETE CASCADE;


--
-- Name: school_customer_documents school_customer_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customer_documents
    ADD CONSTRAINT school_customer_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: school_customers school_customers_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customers
    ADD CONSTRAINT school_customers_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: school_customers school_customers_school_config_id_school_configs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_customers
    ADD CONSTRAINT school_customers_school_config_id_school_configs_id_fk FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: school_expenses school_expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_expenses
    ADD CONSTRAINT school_expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: school_expenses school_expenses_school_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_expenses
    ADD CONSTRAINT school_expenses_school_config_id_fkey FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: school_products school_products_school_config_id_school_configs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.school_products
    ADD CONSTRAINT school_products_school_config_id_school_configs_id_fk FOREIGN KEY (school_config_id) REFERENCES public.school_configs(id);


--
-- Name: transfers transfers_confirmed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES public.users(id);


--
-- Name: transfers transfers_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: transfers transfers_from_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_from_station_id_stations_id_fk FOREIGN KEY (from_station_id) REFERENCES public.stations(id);


--
-- Name: transfers transfers_initiated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_initiated_by_users_id_fk FOREIGN KEY (initiated_by) REFERENCES public.users(id);


--
-- Name: transfers transfers_to_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_to_station_id_stations_id_fk FOREIGN KEY (to_station_id) REFERENCES public.stations(id);


--
-- Name: users users_assigned_station_id_stations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_assigned_station_id_stations_id_fk FOREIGN KEY (assigned_station_id) REFERENCES public.stations(id);


--
-- PostgreSQL database dump complete
--

\unrestrict AHvfjY6p9WUy9pCV9CKHvJTmOQxeymF0dWczmjMB6HgnRC2rd398mxOYumx2cfU

