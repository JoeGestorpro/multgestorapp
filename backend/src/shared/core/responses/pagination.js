function pagination(res, data, { page, limit, total, totalPages, ...extraMeta } = {}) {
  const meta = {
    pagination: { page, limit, total, totalPages },
    ...extraMeta,
  }
  return res.status(200).json({
    success: true,
    data,
    meta,
  })
}

module.exports = { pagination }
