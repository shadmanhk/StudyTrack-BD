
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialStudyTrackSchema1794527263577
  implements MigrationInterface
{
  name = 'InitialStudyTrackSchema1794527263577';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Required for uuid_generate_v4()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('STUDENT', 'COUNSELOR', 'ADMIN')`);

    await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'STUDENT', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "universities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(200) NOT NULL, "country" character varying(100) NOT NULL, "city" character varying(100), "website" character varying(255), "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fb24927667847756f2d490d9fe8" UNIQUE ("name", "country"), CONSTRAINT "PK_8da52f2cee6b407559fdbabf59e" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TYPE "public"."programs_degree_level_enum" AS ENUM('BACHELORS', 'MASTERS', 'PHD', 'OTHER')`);

    await queryRunner.query(`CREATE TABLE "programs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(200) NOT NULL, "degree_level" "public"."programs_degree_level_enum" NOT NULL, "field_of_study" character varying(150), "language_of_instruction" character varying(100), "duration_months" integer, "official_url" character varying(255), "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "university_id" uuid NOT NULL, CONSTRAINT "UQ_a0459a562a581182be1e2f75494" UNIQUE ("university_id", "name", "degree_level"), CONSTRAINT "PK_d43c664bcaafc0e8a06dfd34e05" PRIMARY KEY ("id"))`);

    // Shared application status enum: create only once.
    await queryRunner.query(`CREATE TYPE "public"."application_status_enum" AS ENUM('DRAFT', 'PLANNING', 'DOCUMENTS_PENDING', 'READY_TO_SUBMIT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'APPOINTMENT_SCHEDULED')`);

    await queryRunner.query(`CREATE TABLE "applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "intake_term" character varying(50), "intake_year" integer, "status" "public"."application_status_enum" NOT NULL DEFAULT 'DRAFT', "application_reference" character varying(100), "applied_at" TIMESTAMP, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "student_id" uuid NOT NULL, "program_id" uuid NOT NULL, "assigned_counselor_id" uuid, CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TYPE "public"."document_types_category_enum" AS ENUM('IDENTITY', 'ACADEMIC', 'LANGUAGE', 'FINANCIAL', 'APPLICATION', 'OTHER')`);

    await queryRunner.query(`CREATE TABLE "document_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "category" "public"."document_types_category_enum" NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_803cd247b7c1c8d91b30a3eb210" UNIQUE ("name"), CONSTRAINT "PK_d467d7eeb7c8ce216e90e8494aa" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TYPE "public"."application_documents_status_enum" AS ENUM('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')`);

    await queryRunner.query(`CREATE TABLE "application_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "is_required" boolean NOT NULL DEFAULT true, "status" "public"."application_documents_status_enum" NOT NULL DEFAULT 'PENDING', "submitted_at" TIMESTAMP, "verified_at" TIMESTAMP, "remarks" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "application_id" uuid NOT NULL, "document_type_id" uuid NOT NULL, CONSTRAINT "UQ_8ffc62f3d7fb8703b5bf965f156" UNIQUE ("application_id", "document_type_id"), CONSTRAINT "PK_592142aa992e003beadf1409e9e" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TYPE "public"."appointments_appointment_type_enum" AS ENUM('EMBASSY_VISA', 'BIOMETRICS', 'INTERVIEW', 'OTHER')`);

    await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'MISSED')`);

    await queryRunner.query(`CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointment_type" "public"."appointments_appointment_type_enum" NOT NULL, "embassy_name" character varying(200), "country" character varying(100) NOT NULL, "city" character varying(100), "appointment_at" TIMESTAMP WITH TIME ZONE NOT NULL, "time_zone" character varying(60), "reference_number" character varying(100), "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'SCHEDULED', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "application_id" uuid NOT NULL, CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);

    // Reuse the application_status_enum created above.
    await queryRunner.query(`CREATE TABLE "status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "previous_status" "public"."application_status_enum", "new_status" "public"."application_status_enum" NOT NULL, "remarks" text, "changed_at" TIMESTAMP NOT NULL DEFAULT now(), "application_id" uuid NOT NULL, "changed_by_user_id" uuid NOT NULL, CONSTRAINT "PK_271a5228edb4eeb41bc01d58fac" PRIMARY KEY ("id"))`);

    // Foreign keys
    await queryRunner.query(`ALTER TABLE "programs" ADD CONSTRAINT "FK_e7e3483492f92140de30e52a6ea" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_791e5e9cf054d0295ebfe4491a9" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_1cb4cb9e96a4bcfc8eb05756d13" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_3898904e81fb98817fc8f32fbf6" FOREIGN KEY ("assigned_counselor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "application_documents" ADD CONSTRAINT "FK_9ad8ab815e842d67e9aaec900cb" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "application_documents" ADD CONSTRAINT "FK_b559d97180e6516974b13e24905" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_ea1002cd0a41822ca930cb1c7e5" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "status_history" ADD CONSTRAINT "FK_970d2336335ddec72ac0184dff4" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "status_history" ADD CONSTRAINT "FK_2ad8cbd19c995a38af985889dbf" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign keys first.
    await queryRunner.query(`ALTER TABLE "status_history" DROP CONSTRAINT "FK_2ad8cbd19c995a38af985889dbf"`);
    await queryRunner.query(`ALTER TABLE "status_history" DROP CONSTRAINT "FK_970d2336335ddec72ac0184dff4"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_ea1002cd0a41822ca930cb1c7e5"`);
    await queryRunner.query(`ALTER TABLE "application_documents" DROP CONSTRAINT "FK_b559d97180e6516974b13e24905"`);
    await queryRunner.query(`ALTER TABLE "application_documents" DROP CONSTRAINT "FK_9ad8ab815e842d67e9aaec900cb"`);
    await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_3898904e81fb98817fc8f32fbf6"`);
    await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_1cb4cb9e96a4bcfc8eb05756d13"`);
    await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_791e5e9cf054d0295ebfe4491a9"`);
    await queryRunner.query(`ALTER TABLE "programs" DROP CONSTRAINT "FK_e7e3483492f92140de30e52a6ea"`);

    // Drop tables before dropping their enum types.
    await queryRunner.query(`DROP TABLE "status_history"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TABLE "application_documents"`);
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TABLE "programs"`);
    await queryRunner.query(`DROP TABLE "document_types"`);
    await queryRunner.query(`DROP TABLE "universities"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop each enum type exactly once.
    await queryRunner.query(`DROP TYPE "public"."application_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."appointments_appointment_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."application_documents_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."document_types_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."programs_degree_level_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
