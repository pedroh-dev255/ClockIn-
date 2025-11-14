'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '../components/navbar'
import { EyeIcon, EyeOffIcon } from 'lucide-react';


export default function SaldosPage() {


    return (
        <div className="min-h-screen flex flex-col">
          <Navbar/>
        </div>
    );
}