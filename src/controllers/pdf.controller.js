const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const asyncHandler = require("../utils/asyncHandler");
const createError = require("../utils/createError");
const getImageBufferFromUrl = require("../utils/getImageBufferFromUrl");

const formatDate = (date) => {
  return new Date(date).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const sanitizeFileName = (fileName) => {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9ñáéíóúü\s-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
};

const downloadPostPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de posteo inválido", 400);
  }

  const post = await Post.findById(id).populate("autor", "nombre email rol");

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  const comments = await Comment.find({ post: post._id })
    .populate("autor", "nombre email rol")
    .sort({ createdAt: 1 });

  const fileName = sanitizeFileName(post.titulo) || "posthub-posteo";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}.pdf"`
  );

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  doc.pipe(res);

  doc.fontSize(22).text("PostHub", {
    align: "center",
  });

  doc.moveDown(0.5);

  doc.fontSize(16).text("Posteo exportado", {
    align: "center",
  });

  doc.moveDown(2);

  doc.fontSize(20).text(post.titulo, {
    underline: true,
  });

  doc.moveDown();

  doc.fontSize(11).text(`Autor: ${post.autor?.nombre || "Usuario eliminado"}`);
  doc.text(`Email: ${post.autor?.email || "Sin email"}`);
  doc.text(`Fecha de creación: ${formatDate(post.createdAt)}`);

  doc.moveDown();

  doc.fontSize(14).text("Contenido", {
    underline: true,
  });

  doc.moveDown(0.5);

  doc.fontSize(12).text(post.contenido, {
    align: "left",
    lineGap: 4,
  });

  if (post.imagen) {
    doc.moveDown();

    doc.fontSize(14).text("Imagen", {
      underline: true,
    });

    doc.moveDown(0.5);

    try {
      const imageBuffer = await getImageBufferFromUrl(post.imagen);

      if (imageBuffer) {
        doc.image(imageBuffer, {
          fit: [450, 250],
          align: "center",
        });
      }
    } catch (error) {
      doc.fontSize(11).text("No se pudo cargar la imagen del posteo en el PDF.");
    }
  }

  doc.moveDown(2);

  doc.fontSize(14).text("Comentarios", {
    underline: true,
  });

  doc.moveDown(0.5);

  if (comments.length === 0) {
    doc.fontSize(12).text("Este posteo todavía no tiene comentarios.");
  } else {
    comments.forEach((comment, index) => {
      doc.fontSize(12).text(`${index + 1}. ${comment.contenido}`, {
        lineGap: 3,
      });

      doc.fontSize(10).text(
        `Autor: ${comment.autor?.nombre || "Usuario eliminado"} - Fecha: ${formatDate(
          comment.createdAt
        )}`
      );

      doc.moveDown();
    });
  }

  doc.moveDown();

  doc.fontSize(9).text("PDF generado automáticamente por PostHub.", {
    align: "center",
  });

  doc.end();
});

module.exports = {
  downloadPostPdf,
};