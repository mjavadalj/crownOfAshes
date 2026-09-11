import 'dart:math' as math;
import 'package:flutter/material.dart';

/// The same engraved metalwork surrounds cards, decisions and separators.
class ReliquaryFrame extends CustomPainter {
  const ReliquaryFrame({
    this.button = false,
    this.color = const Color(0xFF99764E),
  });
  final bool button;
  final Color color;

  Path _outline(Rect r, double cut) =>
      Path()
        ..moveTo(r.left + cut, r.top)
        ..lineTo(r.right - cut, r.top)
        ..lineTo(r.right, r.top + cut)
        ..lineTo(r.right, r.bottom - cut)
        ..lineTo(r.right - cut, r.bottom)
        ..lineTo(r.left + cut, r.bottom)
        ..lineTo(r.left, r.bottom - cut)
        ..lineTo(r.left, r.top + cut)
        ..close();

  @override
  void paint(Canvas canvas, Size size) {
    final pen =
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1;
    final outer = Offset.zero & size;
    canvas.drawPath(_outline(outer.deflate(5), button ? 12 : 18), pen);
    pen.color = color.withValues(alpha: .45);
    canvas.drawPath(_outline(outer.deflate(9), button ? 8 : 14), pen);
    // Broken highlights give the brass an irregular, worn edge at every scale.
    final random = math.Random(73);
    for (var i = 0; i < (size.height + size.width) / 5; i++) {
      final horizontal = i.isEven;
      final x =
          horizontal
              ? 16 + random.nextDouble() * math.max(0, size.width - 32)
              : (i % 4 == 1 ? 5.0 : size.width - 5);
      final y =
          horizontal
              ? (i % 4 == 0 ? 5.0 : size.height - 5)
              : 16 + random.nextDouble() * math.max(0, size.height - 32);
      pen
        ..color = (i % 3 == 0
                ? const Color(0xFFE0BC89)
                : const Color(0xFF312720))
            .withValues(alpha: .7)
        ..strokeWidth = random.nextDouble() * 1.4 + .6;
      canvas.drawLine(
        Offset(x, y),
        Offset(
          x + (horizontal ? 2 + random.nextDouble() * 5 : 0),
          y + (horizontal ? 0 : 2 + random.nextDouble() * 5),
        ),
        pen,
      );
    }
    pen
      ..color = color
      ..strokeWidth = 1;
    for (final corner in [
      Offset(13, 13),
      Offset(size.width - 13, 13),
      Offset(13, size.height - 13),
      Offset(size.width - 13, size.height - 13),
    ]) {
      final sx = corner.dx < size.width / 2 ? 1.0 : -1.0;
      final sy = corner.dy < size.height / 2 ? 1.0 : -1.0;
      canvas.save();
      canvas.translate(corner.dx, corner.dy);
      canvas.scale(sx, sy);
      canvas.drawPath(
        Path()
          ..moveTo(-5, 19)
          ..lineTo(0, 11)
          ..lineTo(0, 0)
          ..lineTo(11, 0)
          ..lineTo(19, -5)
          ..moveTo(2, 12)
          ..lineTo(6, 6)
          ..lineTo(12, 2),
        pen,
      );
      canvas.drawCircle(const Offset(4, 4), 2, pen);
      canvas.restore();
    }
    drawFinial(canvas, Offset(size.width / 2, 6), button ? 7 : 16, color);
    drawFinial(
      canvas,
      Offset(size.width / 2, size.height - 6),
      button ? 6 : 10,
      color,
    );
  }

  static void drawFinial(
    Canvas canvas,
    Offset center,
    double radius,
    Color color,
  ) {
    final pen =
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1;
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.drawPath(
      Path()
        ..moveTo(0, -radius)
        ..lineTo(radius * .22, -radius * .3)
        ..lineTo(radius * .5, 0)
        ..lineTo(radius * .22, radius * .25)
        ..lineTo(0, radius)
        ..lineTo(-radius * .22, radius * .25)
        ..lineTo(-radius * .5, 0)
        ..lineTo(-radius * .22, -radius * .3)
        ..close()
        ..moveTo(-radius, -radius * .35)
        ..lineTo(-radius * .65, radius * .15)
        ..lineTo(0, 0)
        ..lineTo(radius * .65, radius * .15)
        ..lineTo(radius, -radius * .35),
      pen,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(ReliquaryFrame oldDelegate) =>
      button != oldDelegate.button || color != oldDelegate.color;
}

class ReliquaryDivider extends CustomPainter {
  const ReliquaryDivider();
  @override
  void paint(Canvas canvas, Size size) {
    const brass = Color(0xFF99764E);
    final pen =
        Paint()
          ..color = brass.withValues(alpha: .65)
          ..strokeWidth = .7;
    final y = size.height / 2;
    canvas.drawLine(
      Offset(size.width * .12, y),
      Offset(size.width / 2 - 14, y),
      pen,
    );
    canvas.drawLine(
      Offset(size.width / 2 + 14, y),
      Offset(size.width * .88, y),
      pen,
    );
    ReliquaryFrame.drawFinial(canvas, Offset(size.width / 2, y), 10, brass);
  }

  @override
  bool shouldRepaint(ReliquaryDivider oldDelegate) => false;
}
