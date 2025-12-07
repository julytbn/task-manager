import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const clientId = params.clientId

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })

    const originalName = (form.get('nom')?.toString()) || (file as any).name || 'file'
    const description = form.get('description')?.toString() || null
    const type = form.get('type')?.toString() || null
    const uploadPar = form.get('uploadPar')?.toString() || null

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'clients', clientId)
    await fs.mkdir(uploadsDir, { recursive: true })
    const timestamp = Date.now()
    const safeName = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const filePath = path.join(uploadsDir, safeName)
    await fs.writeFile(filePath, buffer)

    const url = `/uploads/clients/${clientId}/${safeName}`
    const taille = Math.round((buffer.length / 1024 / 1024) * 100) / 100 // Taille en Mo, 2 décimales

    const doc = await prisma.documentClient.create({
      data: {
        nom: originalName,
        description,
        type,
        url,
        clientId,
        taille,
        uploadPar,
      },
    })

    return new Response(JSON.stringify(doc), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Upload error', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const clientId = params.clientId
    const docs = await prisma.documentClient.findMany({
      where: { clientId },
      orderBy: { dateUpload: 'desc' },
    })
    return new Response(JSON.stringify(docs), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Fetch documents error', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}
