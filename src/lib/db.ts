import { db, auth } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const store = {
  async getUser(userId: string) {
    try {
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${userId}`);
    }
  },
  async setUser(userId: string, data: any) {
    try {
      await setDoc(doc(db, 'users', userId), data, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}`);
    }
  },
  async getPdfs(userId: string) {
    try {
      const q = query(collection(db, 'pdfs'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'pdfs');
      return [];
    }
  },
  async setPdf(pdfId: string, data: any) {
    try {
      await setDoc(doc(db, 'pdfs', pdfId), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `pdfs/${pdfId}`);
    }
  },
  async deletePdf(pdfId: string) {
    try {
      await deleteDoc(doc(db, 'pdfs', pdfId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `pdfs/${pdfId}`);
    }
  },
  async getAttempts(userId: string) {
    try {
      const q = query(collection(db, 'attempts'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'attempts');
      return [];
    }
  },
  async setAttempt(attemptId: string, data: any) {
    try {
      await setDoc(doc(db, 'attempts', attemptId), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `attempts/${attemptId}`);
    }
  },
  async getFlashcards(userId: string, pdfId: string) {
    try {
      const q = query(collection(db, 'flashcards'), where('userId', '==', userId), where('pdfId', '==', pdfId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'flashcards');
      return null;
    }
  },
  async setFlashcards(flashcardId: string, data: any) {
    try {
      await setDoc(doc(db, 'flashcards', flashcardId), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `flashcards/${flashcardId}`);
    }
  }
};
