router.delete(
  "/documents/:documentId",
  authenticate,
  validate(deleteDocumentSchema, "params"),
  deleteDocumentController,
);
