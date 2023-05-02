"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   * data should be { title, salary, equity, companyHandle }
   * Returns { id, title, salary, equity, companyHandle } */
  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
      `SELECT title
      FROM jobs
      WHERE title = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO jobs
               (title, salary, equity, company_handle)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id, title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];

    return job;
  }
  /* Find all jobs (optional filter on searchFilters) */
  static async findAll({ title, minSalary, hasEquity } = {}) {
    let query = `SELECT title, salary, equity, company_handle
                 FROM jobs`;
    let whereExpressions = [];
    let queryValues = [];

    // For each possible search term, add to whereExpressions and queryValues
    if (title !== undefined) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`minSalary <= $${queryValues.length}`);
    }

    if (hasEquity === true) {
      queryValues.push(hasEquity);
      whereExpressions.push(`equity > 0`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    // Finalize query and return results
    query += " ORDER BY title";
    const jobsRes = await db.query(query, queryValues);
    return jobsRes.rows;
  }

  /* Given a job id, return data about job */
  static async get(id) {
    const jobRes = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
      FROM jobs
      WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /* Update job data with `data` */
  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE handle = ${idVarIdx} 
                      RETURNING id, title, salary, equity, companay_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   * Throws NotFoundError if job not found. */
  static async remove(id) {
    const result = await db.query(
      `DELETE
      FROM jobs
      WHERE id = $1
      RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${job}`);
  }
}

module.exports = Job;
