-- PMO Portal — Datos reales de AXTEL (importados desde Supabase)

TRUNCATE TABLE resource_assignments, project_comments, project_files, project_images,
  budget_files, project_budgets, projects, structures, user_module_permissions,
  user_company_permissions, user_portfolio_permissions, user_invitations,
  user_roles, profiles, portfolios, companies, participants, activities,
  skills, participant_skills, resources, resource_skills CASCADE;

-- Empresas
INSERT INTO companies (id, name) VALUES
  ('6a881a9e-c45a-49ea-bcf4-4dc4d79564ba','AXTEL'),
  ('a27453c7-9659-4d36-bab4-5f50be1a1840','SIGMA');

-- Perfiles
INSERT INTO profiles (id, azure_oid, email, display_name) VALUES
  ('19598cda-59a5-4d60-b0da-fdf145075685','ab2f331b-67ef-480d-81f4-439229151565','a00165829@gmail.com','Mario Treviño'),
  ('ee2226df-2969-401b-94a4-b7d131bef54c','62799959-f25f-46b2-b3b8-b01d796036a8','mario_trevino@yahoo.com','Mario Treviño (2)'),
  ('22222222-0000-0000-0000-000000000001','dev-oid-001','admin@empresa.com','Administrador (Dev)');

-- Roles
INSERT INTO user_roles (user_id, role) VALUES
  ('19598cda-59a5-4d60-b0da-fdf145075685','admin'),
  ('ee2226df-2969-401b-94a4-b7d131bef54c','admin'),
  ('22222222-0000-0000-0000-000000000001','admin');

-- Portafolios
INSERT INTO portfolios (id, name, company_id) VALUES
  ('e388da96-1d26-4927-9e59-c2d643e148d6','Movilidad','6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('a1c54ddb-2128-4804-9943-39d4be823360','Proyectos Regulatorios','6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('b48f26f8-0e6a-46e6-be04-c39d84ff1131','EMBUTIDOS','a27453c7-9659-4d36-bab4-5f50be1a1840');

-- Permisos usuario dev
INSERT INTO user_portfolio_permissions (user_id, portfolio_id) VALUES
  ('22222222-0000-0000-0000-000000000001','e388da96-1d26-4927-9e59-c2d643e148d6'),
  ('22222222-0000-0000-0000-000000000001','a1c54ddb-2128-4804-9943-39d4be823360'),
  ('22222222-0000-0000-0000-000000000001','b48f26f8-0e6a-46e6-be04-c39d84ff1131');

INSERT INTO user_company_permissions (user_id, company_id) VALUES
  ('22222222-0000-0000-0000-000000000001','6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('22222222-0000-0000-0000-000000000001','a27453c7-9659-4d36-bab4-5f50be1a1840');

INSERT INTO user_module_permissions (user_id, module) VALUES
  ('22222222-0000-0000-0000-000000000001','budget'),
  ('22222222-0000-0000-0000-000000000001','resources'),
  ('22222222-0000-0000-0000-000000000001','reports');

-- Estructuras
INSERT INTO structures (id, name, total_budget, portfolio_id, created_by) VALUES
  ('00ced214-610b-4c6f-a2d0-cbcef2f7990d','COL_JUS_001',60400,'e388da96-1d26-4927-9e59-c2d643e148d6','22222222-0000-0000-0000-000000000001'),
  ('d563360d-4407-4354-a421-8ef683b939f0','EST_GO_BIG_01',10000,'e388da96-1d26-4927-9e59-c2d643e148d6','22222222-0000-0000-0000-000000000001'),
  ('9de18bd7-62e2-4b33-ae14-c3dde992950a','EST_CEL_IT_01',50000,'e388da96-1d26-4927-9e59-c2d643e148d6','22222222-0000-0000-0000-000000000001');

-- Actividades
INSERT INTO activities (id, name, created_by) VALUES
  ('fd80899a-6b10-4017-a875-52b8b8c23f95','Desarrollador','22222222-0000-0000-0000-000000000001'),
  ('34e9d216-eb6e-425b-91c4-4a1133de6af4','Scrum Master','22222222-0000-0000-0000-000000000001'),
  ('1a8ac39e-ad7b-4ffc-99d3-6727dbc8c52f','Business Architect','22222222-0000-0000-0000-000000000001'),
  ('dc214949-fdbf-4efd-bd0e-2ef7cd4a17cb','System Architect','22222222-0000-0000-0000-000000000001');

-- Participantes
INSERT INTO participants (id, name, email, company_id) VALUES
  ('4ea3a14f-a095-4f98-9f8e-d7d09cac0b7d','Alejandro Tlahuiz Portillo','atlahuiz@axtel.com.mx','6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('545d6dff-3129-423f-920a-3aa36ee5b4a7','Miguel Angel Garcia de la Rosa','miggarcia@axtel.com.mx','6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('86d905f8-158e-4fd0-bd09-db2c971d0b4c','Martha Lopez Ruiz','mlopezr@axtel.com.mx','6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('f5376983-f99b-4b42-afc7-cf49cc7a9c83','Mario Alberto Treviño Salazar','mtrevino@axtel.com.mx','6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('ac127d84-1196-4f8e-a9ad-6ccc16a52b84','Arturo Garza Valdez','argarza@axtel.com.mx','6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('6a4965e5-d3bd-4c94-825d-68fd9d002087','Jose Cuauhtemoc Ramos','jramos@axtel.com.mx','6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('a55997f6-cb74-403f-824c-1cecf7b2b9c7','Lider Pendiente',NULL,'6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('d45e1944-cc9d-4166-af92-9ffceb470cac','Lider Pendiente 2',NULL,'6a881a9e-c45a-49ea-bcf4-4dc4d79564ba'),
  ('e3fd140b-6aaf-4e1a-b528-297ab7ba1c89','Recurso Asignado',NULL,'6a881a9e-c45a-49ea-bcf4-4dc4d79564ba');

-- Proyectos
INSERT INTO projects (id,portfolio_id,name,classification,priority,progress,scrum_stage,stage,
  responsible_id,dev_start_date,dev_end_date,test_start_date,test_end_date,
  planned_go_live_date,go_live_date,project_start_date,description,deleted_at,created_by) VALUES
  ('fe551574-469e-4445-ab3c-159d92837d22','e388da96-1d26-4927-9e59-c2d643e148d6','Pega FF Partir Reservas por Cuenta / Sitio / Zona','Mejora',NULL,100,'Completado','Completado','4ea3a14f-a095-4f98-9f8e-d7d09cac0b7d','2026-02-02','2026-02-12','2026-02-13','2026-03-13','2026-03-14','2026-03-14','2026-01-02','PEGA FULFILLMENT - PARTIR RESERVAS',NULL,'22222222-0000-0000-0000-000000000001'),
  ('b526588b-d636-46fd-91e3-59a94ea7f74d','e388da96-1d26-4927-9e59-c2d643e148d6','Facturacion Marca Blanca Go BIG','Proyecto',NULL,0,'Backlog','Backlog','ac127d84-1196-4f8e-a9ad-6ccc16a52b84',NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-02','MARCA BLANCA - GO BIG',NULL,'22222222-0000-0000-0000-000000000001'),
  ('f4f18126-3060-4ea7-9cb8-45ffdb640e47','a1c54ddb-2128-4804-9943-39d4be823360','Colaboracion con la Justicia - PUI - BD Personas Desaparecidas','Proyecto',1,46,'En Desarrollo','En Desarrollo','f5376983-f99b-4b42-afc7-cf49cc7a9c83','2026-03-09','2026-04-17','2026-04-20','2026-05-08','2026-05-11','2026-05-11','2026-02-02','Colaboracion con la Justicia - PUI - BD Personas Desaparecidas',NULL,'22222222-0000-0000-0000-000000000001'),
  ('5c6bd496-d7fc-4d9f-b1df-13f90d13c014','e388da96-1d26-4927-9e59-c2d643e148d6','Facturacion MVNO VADSA','Proyecto',0,85,'UAT','UAT','ac127d84-1196-4f8e-a9ad-6ccc16a52b84','2026-02-02','2026-03-20','2026-03-23','2026-03-26','2026-04-01','2026-04-01','2026-01-01','MVNO VADSA - Facturacion y configuracion de ofertas',NULL,'22222222-0000-0000-0000-000000000001'),
  ('377b20d7-2e72-4e6f-9c62-d0952553ee3f','e388da96-1d26-4927-9e59-c2d643e148d6','Facturacion Marca Blanca Payclip','Proyecto',NULL,0,'Backlog','Backlog',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MARCA BLANCA PAYCLIP',NULL,'22222222-0000-0000-0000-000000000001'),
  ('3a00dec0-324d-4557-b03f-93419bf23661','e388da96-1d26-4927-9e59-c2d643e148d6','Facturación_OTC a Plazos In Control 2','Mejora',NULL,60,'Backlog','Backlog','a55997f6-cb74-403f-824c-1cecf7b2b9c7','2026-03-17','2026-04-10','2026-04-13','2026-04-16','2026-04-17','2026-04-17','2026-03-02','OTC A PLAZOS - IN CONTROL 2',NULL,'22222222-0000-0000-0000-000000000001'),
  ('8e1860c5-717e-4b00-bdef-0a9deb539645','e388da96-1d26-4927-9e59-c2d643e148d6','Pega FF - Enviar campos extra para mensajería','Mejora',NULL,100,'Completado','Completado','4ea3a14f-a095-4f98-9f8e-d7d09cac0b7d','2026-02-13','2026-02-25','2026-03-26','2026-03-13','2026-03-14','2026-03-14','2026-01-02','PEGA FULFILLMENT - MENSAJERIA',NULL,'22222222-0000-0000-0000-000000000001'),
  ('15734173-2d3a-430c-a13f-929bfcd6a5dd','e388da96-1d26-4927-9e59-c2d643e148d6','BI LTE Pool Mejoras Proceso Operativo y Alarmas','Mejora',NULL,78,'En Desarrollo','En Desarrollo','545d6dff-3129-423f-920a-3aa36ee5b4a7','2026-02-02','2026-03-10',NULL,NULL,'2026-04-01','2026-04-01','2026-02-02','LTE POOL - Mejoras en proceso operativo',NULL,'22222222-0000-0000-0000-000000000001'),
  ('8c5b46ba-67ad-49d4-a06d-868345afa4e1','e388da96-1d26-4927-9e59-c2d643e148d6','Pega VDS Calculo de monto pagare y garantia en multiples cuentas','Mejora',NULL,0,'En Desarrollo','En Desarrollo','86d905f8-158e-4fd0-bd09-db2c971d0b4c','2026-02-18','2026-03-31',NULL,NULL,'2026-04-18','2026-04-18','2026-02-18','PEGA VDS - SOPORTE MAS DE 1 CUENTA',NULL,'22222222-0000-0000-0000-000000000001'),
  ('67d5f74f-e5c8-4d00-bd60-223109e9e61a','b48f26f8-0e6a-46e6-be04-c39d84ff1131','Control de Embutidos','Proyecto',1,74,'Backlog','Backlog','4ea3a14f-a095-4f98-9f8e-d7d09cac0b7d','2026-04-03','2026-02-03','2026-03-18','2026-03-27','2026-03-27','2026-04-04','2026-02-02','Control de Embutidos',NULL,'22222222-0000-0000-0000-000000000001'),
  ('06211444-ff6a-4774-a429-c629c59c2fc9','e388da96-1d26-4927-9e59-c2d643e148d6','FACTURACION Marca Blanca BBVA','Proyecto',1,43,'En Desarrollo','En Desarrollo','a55997f6-cb74-403f-824c-1cecf7b2b9c7','2026-03-10','2026-03-24','2026-03-25','2026-03-30','2026-04-01','2026-04-01','2026-03-09','MARCA BLANCA - BBVA',NULL,'22222222-0000-0000-0000-000000000001'),
  ('efa719bb-d520-42af-a31c-8a5e36dc38ff','e388da96-1d26-4927-9e59-c2d643e148d6','MVNO VADSA - Facturación','Proyecto',2,85,'Go Live','Go Live','ac127d84-1196-4f8e-a9ad-6ccc16a52b84',NULL,NULL,NULL,NULL,'2026-04-01','2026-04-01','2026-01-01','Facturacion de MVNO VADSA','2026-03-19 02:59:58+00','22222222-0000-0000-0000-000000000001'),
  ('77b6c466-2e8a-4083-a1f3-0d882fc653ed','e388da96-1d26-4927-9e59-c2d643e148d6','BI LTE POOL -Mejoras para convivencia con otros planes / bonos','Mejora',NULL,30,'En Desarrollo','En Desarrollo','d45e1944-cc9d-4166-af92-9ffceb470cac','2026-03-11',NULL,NULL,NULL,NULL,NULL,'2026-02-02','LTE POOL - Mejoras en desarrollo BI',NULL,'22222222-0000-0000-0000-000000000001'),
  ('a4a201ef-3add-48c5-846e-7fea6c965a29','e388da96-1d26-4927-9e59-c2d643e148d6','RENOVACIONES de Planes y Equipos','Proyecto',NULL,0,'Backlog','Backlog','f5376983-f99b-4b42-afc7-cf49cc7a9c83',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'RENOVACIONES - Venta / Ordenamiento / Entrega',NULL,'22222222-0000-0000-0000-000000000001'),
  ('dd725375-6166-4fc8-9c26-3adbfd36d5d3','e388da96-1d26-4927-9e59-c2d643e148d6','Celula IT','Proyecto',NULL,0,'Backlog','Backlog','f5376983-f99b-4b42-afc7-cf49cc7a9c83',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Celula IT para Desarrollos Movilidad',NULL,'22222222-0000-0000-0000-000000000001');

-- Presupuestos
INSERT INTO project_budgets (id, project_id, structure_id, authorized_amount, spent_amount, authorization_date) VALUES
  ('ac77817a-5f89-43cb-8223-ddf723a09e4d','b526588b-d636-46fd-91e3-59a94ea7f74d','d563360d-4407-4354-a421-8ef683b939f0',10000,0,'2026-04-01'),
  ('c3297054-11fc-468b-9524-a94c85d2115a','dd725375-6166-4fc8-9c26-3adbfd36d5d3','9de18bd7-62e2-4b33-ae14-c3dde992950a',50000,0,'2026-04-01');

-- Comentarios
INSERT INTO project_comments (id, project_id, user_id, content) VALUES
  ('7d6bce99-c191-4c75-aebe-b59524931d9f','efa719bb-d520-42af-a31c-8a5e36dc38ff','22222222-0000-0000-0000-000000000001','Esta es una prueba de comentario del proyecto.'),
  ('50e195aa-378f-4be3-97f9-e0949b7c5d2b','f4f18126-3060-4ea7-9cb8-45ffdb640e47','22222222-0000-0000-0000-000000000001','Liga al plan de trabajo en SharePoint.'),
  ('49c7a88b-6fc0-498b-9e9a-619ac019baaa','f4f18126-3060-4ea7-9cb8-45ffdb640e47','22222222-0000-0000-0000-000000000001','18/Mar/2026 - Se reviso con el equipo el plan de trabajo.');

-- Asignaciones activas
INSERT INTO resource_assignments (id,participant_id,project_id,portfolio_id,activity_id,start_date,end_date,leader_name,has_overlap,allocation_percentage) VALUES
  ('18c25258-b71a-4f45-aa4c-b75a6ccbe371','e3fd140b-6aaf-4e1a-b528-297ab7ba1c89','f4f18126-3060-4ea7-9cb8-45ffdb640e47','a1c54ddb-2128-4804-9943-39d4be823360','fd80899a-6b10-4017-a875-52b8b8c23f95','2026-04-06','2026-04-15','Arturo Garza Valdez',false,50),
  ('c16843d1-35f4-428c-9382-76f99a8a3856','e3fd140b-6aaf-4e1a-b528-297ab7ba1c89','b526588b-d636-46fd-91e3-59a94ea7f74d','e388da96-1d26-4927-9e59-c2d643e148d6','fd80899a-6b10-4017-a875-52b8b8c23f95','2026-03-23','2026-03-27','Alejandro Tlahuiz Portillo',false,56),
  ('66a0060a-9b42-4ecf-80ab-d345d015fa23','e3fd140b-6aaf-4e1a-b528-297ab7ba1c89','377b20d7-2e72-4e6f-9c62-d0952553ee3f','e388da96-1d26-4927-9e59-c2d643e148d6','fd80899a-6b10-4017-a875-52b8b8c23f95','2026-03-23','2026-04-30',NULL,false,41);

-- Historial de estatus
INSERT INTO project_status_history (project_id, user_id, description, stage, notes) VALUES
  ('f4f18126-3060-4ea7-9cb8-45ffdb640e47','22222222-0000-0000-0000-000000000001',
   'Se reviso con el equipo el plan de trabajo. Aclaraciones sobre 3 razones sociales.',
   'En Desarrollo',
   'Sistema debe estar preparado para Alestra Movil, Xtremo y Axtel'),
  ('5c6bd496-d7fc-4d9f-b1df-13f90d13c014','22222222-0000-0000-0000-000000000001',
   'Ajustes pendientes al reporte sumarizado para incluir cargo por linea activa.',
   'UAT', ''),
  ('06211444-ff6a-4774-a429-c629c59c2fc9','22222222-0000-0000-0000-000000000001',
   'Pendiente que confirmen cuando iniciaran aprovisionamiento de lineas (200K lineas).',
   'En Desarrollo', '');
