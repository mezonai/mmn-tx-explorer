import { NextResponse, NextRequest } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const { data, originalName, outputFormat } = await req.json();
    if (!data) {
      return NextResponse.json({ error: 'No data' }, { status: 400 });
    }

    const buffer = Buffer.from(data, 'base64');

    let out: Buffer;
    let mime: string;
    let filename: string;

    if (outputFormat === 'png') {
      out = await sharp(buffer)
        .png({
          compressionLevel: 9,
          adaptiveFiltering: false,
        })
        .toBuffer();

      mime = 'image/png';
      filename = originalName.replace(/\.[^.]+$/, '.png');
    } else {
      out = await sharp(buffer)
        .jpeg({
          quality: 85,
          mozjpeg: true,
        })
        .toBuffer();

      mime = 'image/jpeg';
      filename = originalName.replace(/\.[^.]+$/, '.jpg');
    }

    return NextResponse.json({
      buffer: out.toString('base64'),
      mime,
      filename,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
